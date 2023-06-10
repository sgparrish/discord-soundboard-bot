const { createWriteStream } = require("node:fs");
const pino = require("pino");
const pinoPretty = require("pino-pretty");

const Config = require("./config");
const streams = [
  { level: Config.logLevel, stream: createWriteStream(Config.logFile) },
  { level: "info", stream: pinoPretty() },
];
const logger = pino({ level: "debug" }, pino.multistream(streams));

module.exports = logger;
