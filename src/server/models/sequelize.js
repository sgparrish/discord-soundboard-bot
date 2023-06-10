const { Sequelize } = require("sequelize");

const Config = require("../services/config");

const sequelize = new Sequelize({
  dialect: `sqlite`,
  storage: Config.sqliteDb,
  logging: false,
});

module.exports = sequelize;
