const { Sequelize, DataTypes } = require("sequelize");

const sequelize = require("./sequelize");

const Clip = sequelize.define(
  "Clip",
  {
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    lastPlayed: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    playCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    fileModified: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  },
  {}
);

module.exports = Clip;
