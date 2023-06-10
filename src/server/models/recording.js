const { Sequelize, DataTypes } = require("sequelize");

const sequelize = require("./sequelize");

const Recording = sequelize.define(
  "Recording",
  {
    id: {
      type: DataTypes.UUIDV4,
      defaultValue: Sequelize.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    start: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    text: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.ENUM(["pending", "listening", "completed", "faulted"]),
      defaultValue: "pending",
    },
    messageId: {
      type: DataTypes.STRING,
    },
  },
  {}
);

module.exports = Recording;
