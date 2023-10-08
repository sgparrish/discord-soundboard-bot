const path = require("path");

class Config {
  constructor() {
    this.serverHostname = process.env.SERVER_HOSTNAME || "localhost";
    this.serverPort = process.env.SERVER_PORT || 8080;

    this.dataDir = process.env.DATA_DIR || "data";
    this.logFile = process.env.LOG_FILE || path.join(this.dataDir, "soundboard.log");
    this.logLevel = process.env.LOG_LEVEL || "warn";
    this.sqliteDb = process.env.SQLITE_DB || path.join(this.dataDir, "db.sqlite");
    this.clipsDirectory = process.env.CLIPS_DIRECTORY || path.join(this.dataDir, "clips");
    this.recordingsDirectory = process.env.RECORDINGS_DIRECTORY || path.join(this.dataDir, "recordings");
    this.voskModel = process.env.VOSK_MODEL || path.join(this.dataDir, "model");

    this.discordToken = process.env.DISCORD_TOKEN;
    this.discordOwner = process.env.DISCORD_OWNER;
    this.discordServer = process.env.DISCORD_SERVER;
    this.discordClipChannel = process.env.DISCORD_CLIP_CHANNEL;
    this.discordLogChannel = process.env.DISCORD_RECORDINGS_CHANNEL;
  }
}

module.exports = new Config();
