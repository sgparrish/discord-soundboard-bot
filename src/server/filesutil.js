const fs = require("fs");
const path = require("path");
const glob = require("glob");
const Datastore = require("nedb");
const { v4: uuidv4 } = require("uuid");
const { slice } = require("stream-slice");
const child = require("duplex-child-process");

const db = new Datastore({ filename: process.env.DB_FILE, autoload: true });

class FilesUtil {
  static getDb() {
    return db;
  }

  static getStartupSound() {
    return process.env.STARTUP_SOUND || "startup.mp3";
  }

  static getSoundList() {
    return new Promise((resolve, reject) => {
      glob(path.join(process.env.SOUND_DIR, "**", "*.mp3").replace(/\\/g, "/"), (err, matches) => {
        if (err) reject(err);
        const sets = matches.reduce((soundSets, soundPath) => {
          const parts = soundPath.split("/");
          const category = parts[parts.length - 2];
          const sound = parts[parts.length - 1].slice(0, -4);

          if (!soundSets.some((set) => set.category === category)) {
            soundSets.push({ category, sounds: [] });
          }
          soundSets.find((set) => set.category === category).sounds.push(sound);

          return soundSets;
        }, []);

        resolve(sets);
      });
    });
  }

  static getRecordedSounds() {
    return new Promise((resolve) => {
      db.find({})
        .sort({ start: 1 })
        .exec((err, docs) => {
          resolve(docs);
        });
    });
  }

  static getFileName(root, directory, soundname) {
    // don't forget to wear protection
    if (typeof directory !== "string" || typeof soundname !== "string") throw new Error("uhhh what");
    if (directory.indexOf("\0") !== -1 || soundname.indexOf("\0") !== -1) throw new Error("that's not very cash money");

    const file = path.join(root, directory, soundname + ".mp3");

    if (!file.startsWith(path.join(root))) throw new Error("you dirty dog");

    return file;
  }

  static getSoundFilename(category, soundname) {
    return this.getFileName(process.env.SOUND_DIR, category, soundname);
  }

  static getRecordedFilename(user, soundid) {
    return this.getFileName(process.env.RECORD_DIR, user, soundid);
  }

  static splitFilename(filename) {
    return { basename: path.basename(filename), dirname: path.dirname(filename) };
  }

  static ffmpeg(args, options) {
    return child.spawn(process.env.FFMPEG, args, options);
  }

  static getVosk() {
    return child.spawn(process.env.VOSK_PYTHON, [
      path.join(process.env.VOSK_SCRIPT),
      path.join(process.env.VOSK_MODEL),
    ]);
  }

  static ffmpegToMp3() {
    return this.ffmpeg(["-f", "s16le", "-ac", "2", "-ar", "48000", "-i", "pipe:0", "-f", "mp3", "pipe:1"]);
  }

  static ffmpegToPcm() {
    return this.ffmpeg(["-f", "mp3", "-i", "pipe:0", "-f", "s16le", "-ac", "2", "-ar", "48000", "pipe:1"]);
  }

  static ffmpegToLowRatePcm() {
    return this.ffmpeg([
      "-f",
      "s16le",
      "-ac",
      "2",
      "-ar",
      "48000",
      "-i",
      "pipe:0",
      "-f",
      "s16le",
      "-ac",
      "1",
      "-ar",
      "16000",
      "pipe:1",
    ]);
  }

  static saveRecording(member, stream) {
    const voskEnabled = process.env.VOSK_ENABLED.toLowerCase().startsWith("t");
    const ffmpegMp3 = this.ffmpegToMp3();

    const userId = member.id;
    const userDirectory = path.join(process.env.RECORD_DIR, userId);
    if (!fs.existsSync(userDirectory)) {
      fs.mkdirSync(userDirectory);
    }

    const _id = uuidv4();
    const start = new Date();
    let end = null;
    let text = "";
    const mp3File = path.join(process.env.RECORD_DIR, userId, _id + ".mp3");
    const mp3Stream = fs.createWriteStream(mp3File, { flags: "w" });

    stream.on("end", () => {
      end = new Date();
      if (!voskEnabled) {
        db.insert({
          _id,
          userId,
          start,
          end,
          text,
        });
      }
    });

    if (voskEnabled) {
      const ffmpegLowRatePcm = this.ffmpegToLowRatePcm();
      const vosk = this.getVosk();

      const chunks = [];
      vosk.on("data", (chunk) => {
        chunks.push(chunk);
      });
      vosk.on("end", () => {
        try {
          text = JSON.parse(Buffer.concat(chunks).toString("utf8")).text;
        } catch {
          text = "...";
        }

        db.insert({
          _id,
          userId,
          start,
          end,
          text: text || "...",
        });
      });
      vosk.on("error", () => {
        db.insert({
          _id,
          userId,
          start,
          end,
          text: text || "...",
        });
      });

      stream.pipe(ffmpegLowRatePcm).pipe(vosk);
    }
    stream.pipe(ffmpegMp3).pipe(mp3Stream);
  }

  static createSound(userId, soundId, start, end, name) {
    const inFilename = this.getRecordedFilename(userId, soundId);
    let outFilename = this.getSoundFilename(userId, name);

    const outDir = path.dirname(outFilename);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir);
    }

    if (fs.existsSync(outFilename)) {
      outFilename = outFilename.slice(0, -4) + "(1).mp3";
    }
    while (fs.existsSync(outFilename)) {
      const idx = Number.parseInt(outFilename.match(/.*\(([0-9]+)\).mp3/)[1]);
      outFilename = outFilename.slice(0, -4) + `(${idx + 1}).mp3`;
    }

    const inStream = fs.createReadStream(inFilename);
    const ffmpegPcm = this.ffmpegToPcm();
    const ffmpegMp3 = this.ffmpegToMp3();
    const outStream = fs.createWriteStream(outFilename);

    const framesPerSecond = 48000;
    const startByte = Math.floor(start * framesPerSecond) * 2 * 2;
    const endByte = Math.floor(end * framesPerSecond) * 2 * 2;

    inStream.pipe(ffmpegPcm).pipe(slice(startByte, endByte)).pipe(ffmpegMp3).pipe(outStream);
  }

  static deleteOldFiles() {
    const fileMaxAge = Number.parseInt(process.env.FILE_MAX_AGE_MILLISECONDS) || 1 * 24 * 60 * 60 * 1000;
    const cutoff = new Date(new Date().getTime() - fileMaxAge);
    const query = { start: { $lt: cutoff } };
    db.find(query, (err, docs) => {
      // delete mp3 files
      docs.forEach((doc) => {
        const mp3File = this.getRecordedFilename(doc.userId, doc._id);
        fs.unlink(mp3File, (err) => {
          if (err) console.log("Error removing file: " + mp3File);
        });
      });
      // remove db records
      db.remove(query, { multi: true }, (err, numRemoved) => {
        // clean up db
        db.persistence.compactDatafile();
      });
    });
  }
}

module.exports = FilesUtil;
