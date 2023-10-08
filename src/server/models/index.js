const sequelize = require("./sequelize");
const Recording = require("./recording");
const Clip = require("./clip");
const Consent = require("./consent");

module.exports = {
  sequelize,
  Recording,
  Clip,
  Consent,
};
