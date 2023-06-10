class Config {
  constructor() {
    this.serverHostname = process.env.SERVER_HOSTNAME || "localhost";
    this.serverPort = process.env.SERVER_PORT || 8080;

    this.logFile = process.env.LOG_FILE || "soundboard.log"
    this.logLevel = process.env.LOG_LEVEL || "warn"
    this.sqliteDb = process.env.SQLITE_DB || "db.sqlite";
    this.clipsDirectory = process.env.CLIPS_DIRECTORY || "clips";
    this.recordingsDirectory = process.env.RECORDINGS_DIRECTORY || "recordings";
    this.voskModel = process.env.VOSK_MODEL || "model";

    this.discordToken = process.env.DISCORD_TOKEN;
    this.discordOwner = process.env.DISCORD_OWNER;
    this.discordServer = process.env.DISCORD_SERVER;
    this.discordClipChannel = process.env.DISCORD_CLIP_CHANNEL;
    this.discordLogChannel = process.env.DISCORD_RECORDINGS_CHANNEL;
  }
}

module.exports = new Config();
