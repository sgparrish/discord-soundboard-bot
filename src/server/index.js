require("dotenv").config();
const express = require("express");
const schedule = require("node-schedule");

const FilesUtil = require("./filesutil");
const DiscordClient = require("./discord");

const server = express();
const discordClient = new DiscordClient();

schedule.scheduleJob("0 * * * *", FilesUtil.deleteOldFiles);
FilesUtil.deleteOldFiles();

if (process.env.VOSK_ENABLED.toLowerCase().startsWith("t")) FilesUtil.initializeVoskQueue();

server.use(express.json());
server.use(express.static("dist"));

server.get("/api/sounds", (req, res) => {
  FilesUtil.getSoundList().then((sounds) => {
    const userIds = sounds.map((sound) => sound.category).filter((value, index, self) => self.indexOf(value) === index);
    discordClient.getUserMetadata(userIds).then((users) => {
      res.json({
        users,
        sounds,
      });
    });
  });
});

server.get("/api/sounds/recorded", (req, res) => {
  FilesUtil.getRecordedSounds().then((sounds) => {
    const userIds = sounds.map((sound) => sound.userId).filter((value, index, self) => self.indexOf(value) === index);
    discordClient.getUserMetadata(userIds).then((users) => {
      res.json({
        users,
        sounds,
      });
    });
  });
});

server.get("/api/sound/play/:type/:user/:soundname", (req, res) => {
  const { type, user, soundname } = req.params;
  const sound =
    type.toLowerCase() === "recorded"
      ? FilesUtil.getRecordedFilename(user, soundname)
      : FilesUtil.getSoundFilename(user, soundname);
  discordClient.playSound(sound);
  res.status(204).send();
});

server.get("/api/sound/:userId/:soundId", (req, res) => {
  const { userId, soundId } = req.params;
  const filename = FilesUtil.getRecordedFilename(userId, soundId);
  const { basename, dirname } = FilesUtil.splitFilename(filename);
  res.sendFile(basename, { root: dirname });
});

server.post("/api/sound/cut", (req, res) => {
  const { userId, soundId, start, end, name } = req.body;
  FilesUtil.createSound(userId, soundId, start, end, name);
  res.status(204).send();
});

// catch all for mr react-router, esq
server.get("*", (req, res) => res.sendFile("index.html", { root: "dist" }));

const port = process.env.PORT || 8080;
server.listen(port, () => console.log(`Listening on port ${port} :)`));
