require("dotenv").config();

const path = require("node:path");
const http = require("node:http");
const express = require("express");
const compression = require("compression");
const pinoHttp = require("pino-http");

const Config = require("./services/config");
const Logger = require("./services/logger");
const loadServices = require("./services");

const app = express();
const server = http.createServer(app);

// setup middleware
app.use(pinoHttp({ logger: Logger, useLevel: Config.logLevel }));
app.use(compression());
app.use(express.json());

// setup routes
app.use(express.static("dist"));
app.use(require("./routes"));
app.all("*", (req, res) => {
  res.sendFile(path.resolve("dist", "index.html"));
});

// start server
const port = Config.serverPort;
server.listen(port, "0.0.0.0", () => {
  loadServices(server);
  Logger.info(`Successfully bound to '${Config.serverHostname}:${port}'`);
});
