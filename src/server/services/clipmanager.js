const path = require("node:path");
const { mkdirSync } = require("node:fs");
const { readdir, stat, mkdir } = require("node:fs/promises");
const { spawn } = require("node:child_process");

const { findFFmpeg } = require("prism-media");

const Config = require("./config");
const Logger = require("./logger");
const Persistence = require("./persistence");
const Serialization = require("./serialization");

class ClipManager {
  constructor() {
    this.clipsDir = Config.clipsDirectory;
    mkdirSync(this.clipsDir, { recursive: true });
  }

  PERMITTED_EXTENSIONS = [".mp3", ".ogg"];

  async fileExists(filepath) {
    try {
      await stat(filepath);
      return true;
    } catch {
      return false;
    }
  }

  async getClipFile(category, name) {
    const filePath = path.join(this.clipsDir, category, name);
    const relative = path.relative(".", filePath);
    return relative && !relative.startsWith("..") && !path.isAbsolute(relative) ? relative : undefined;
  }

  async getClips() {
    const directories = await readdir(this.clipsDir, { withFileTypes: true });

    // treat each directory as a category (userid or "music" etc)
    const clips = [];
    for (let i = 0; i < directories.length; i++) {
      const subDir = directories[i];
      if (subDir.isDirectory()) {
        // find all sound files for this category
        const files = await readdir(path.join(this.clipsDir, subDir.name), { withFileTypes: true });
        for (let j = 0; j < files.length; j++) {
          const file = files[j];
          const fullFilePath = path.join(this.clipsDir, subDir.name, file.name);
          const ext = path.extname(fullFilePath).toLowerCase();
          if (file.isFile() && this.PERMITTED_EXTENSIONS.includes(ext)) {
            const fileModified = (await stat(fullFilePath)).mtime;
            const filename = path.basename(fullFilePath);
            const clip = await Persistence.getClip({ category: subDir.name, filename, fileModified });
            clips.push({
              category: subDir.name,
              filename,
              fileModified,
              lastPlayed: clip?.lastPlayed,
              playCount: clip?.playCount ?? 0,
            });
          }
        }
      }
    }
    return clips;
  }

  async clipPlayed(category, filename) {
    const filePath = path.join(this.clipsDir, category, filename);
    const fileModified = (await stat(filePath)).mtime;
    await Persistence.clipPlayed({ category, filename, fileModified });
  }

  async createClip(id, name, start, end) {
    const recording = await Persistence.getRecording(id);
    if (recording === null) return;

    // mkdirs up to path if needed
    const outPath = path.join(this.clipsDir, recording.userId);
    await mkdir(outPath, { recursive: true });
    let outFilename = path.join(outPath, `${name}.mp3`);

    // increment name to disambiguate duplicate names
    for (let i = 1; await this.fileExists(outFilename); i++) {
      outFilename = path.join(outPath, `${name}(${i}).mp3`);
    }

    // just use ffmpeg to do clipping
    const ffmpeg = spawn(
      findFFmpeg().command,
      [
        "-loglevel",
        "quiet",
        "-ss",
        `${start.toFixed(5)}`,
        "-i",
        `"${recording.filename}"`,
        "-t",
        `${(end - start).toFixed(5)}`,
        `"${outFilename}"`,
      ],
      {
        shell: true,
        windowsHide: false,A
      }
    );

    ffmpeg.on("error", (err) => {
      Logger.error(`Error clipping file ${recording.filename} - ${err.message}`);
    });
    ffmpeg.on("exit", async (code) => {
      if (code !== 0) {
        Logger.error(`Error clipping file ${recording.filename}`);
      } else {
        const fileModified = (await stat(outFilename)).mtime;
        const clipDto = await Serialization.toClipDTO({
          category: recording.userId,
          filename: path.basename(outFilename),
          fileModified,
          playCount: 0,
        });
        Persistence.emit(Persistence.events.clip.create.started, clipDto);
      }
    });
  }
}

module.exports = new ClipManager();
