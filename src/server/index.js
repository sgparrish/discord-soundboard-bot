require("dotenv").config();
const express = require("express");
var compression = require("compression");
const schedule = require("node-schedule");

const FilesUtil = require("./filesutil");
const DiscordClient = require("./discord");

const server = express();
const discordClient = new DiscordClient();

schedule.scheduleJob("0 * * * *", FilesUtil.deleteOldFiles);
FilesUtil.deleteOldFiles();

if (process.env.VOSK_ENABLED.toLowerCase().startsWith("t")) FilesUtil.initializeVosk();

// Cache users on start up
FilesUtil.getSoundList().then((sounds) => {
  const userIds = sounds.map((sound) => sound.category).filter((value, index, self) => self.indexOf(value) === index);
  discordClient.getUserMetadata(userIds);
});

server.use(compression());
server.use(express.json());
server.use(express.static("dist"));

server.get("/api/sounds", (req, res) => {
  FilesUtil.getSoundList()
    .then((sounds) => {
      const userIds = sounds
        .map((sound) => sound.category)
        .filter((value, index, self) => self.indexOf(value) === index);
      discordClient
        .getUserMetadata(userIds)
        .then((users) =>
          res.json({
            users: users.map((x) => x.value),
            sounds,
          })
        )
        .catch((err) => res.status(500).json({ error: err }));
    })
    .catch((err) => res.status(500).json({ error: err }));
});

server.get("/api/sounds/recorded", (req, res) => {
  FilesUtil.getRecordedSounds()
    .then((sounds) => {
      const userIds = sounds.map((sound) => sound.userId).filter((value, index, self) => self.indexOf(value) === index);
      discordClient
        .getUserMetadata(userIds)
        .then((users) =>
          res.json({
            users: users.map((x) => x.value),
            sounds,
          })
        )
        .catch((err) => res.status(500).json({ error: err }));
    })
    .catch((err) => res.status(500).json({ error: err }));
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

server.get("/api/sound/:type/:userId/:soundId", (req, res) => {
  const { type, userId, soundId } = req.params;
  const sound =
    type.toLowerCase() === "recorded"
      ? FilesUtil.getRecordedFilename(userId, soundId)
      : FilesUtil.getSoundFilename(userId, soundId);
  const { basename, dirname } = FilesUtil.splitFilename(sound);
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
server.listen(port, "0.0.0.0", () => console.log(`Listening on port ${port} :)`));
