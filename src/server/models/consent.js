const { Sequelize, DataTypes } = require("sequelize");

const sequelize = require("./sequelize");

const Consent = sequelize.define(
  "Consent",
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
    status: {
      type: DataTypes.ENUM(["granted", "revoked"]),
      allowNull: false,
    },
  },
  {}
);

module.exports = Consent;
