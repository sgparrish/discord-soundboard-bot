const { EventEmitter } = require("events");
const { Op } = require("sequelize");

const { sequelize, Recording, Clip, Consent } = require("../models");
const logger = require("./logger");

class Persistence extends EventEmitter {
  events = {
    recording: {
      create: {
        started: "recording.create.started",
        success: "recording.create.success",
      },
      update: {
        started: "recording.update.started",
        success: "recording.update.success",
      },
      delete: {
        started: "recording.delete.started",
        success: "recording.delete.success",
      },
    },
    clip: {
      create: {
        started: "clip.create.started",
        success: "clip.create.success",
      },
      update: {
        success: "clip.update.success",
      },
      delete: {
        success: "clip.update.delete",
      },
    },
    consent: {
      granted: "consent.granted",
      revoked: "consent.revoked",
    },
  };

  constructor() {
    super();

    // constructor can't be async so use promise callbacks to hook up db methods once db is initialized
    // technically a message could slip thru during startup, but whatevs
    sequelize
      .sync({ force: false })
      .then(() => {
        this.on(this.events.recording.create.started, this.createRecording.bind(this));
        this.on(this.events.recording.update.started, this.updateRecording.bind(this));
        this.on(this.events.recording.delete.started, this.deleteRecording.bind(this));

        this.on(this.events.clip.create.started, this.createClip.bind(this));
      })
      .catch((err) => {
        logger.error("Error initializing database: " + err);
      });
  }

  logAndEmit(eventName, event) {
    logger.info({ eventName, event });
    this.emit(eventName, event);
  }

  // #region Recordings
  async getRecording(id) {
    return await Recording.findByPk(id);
  }

  async getRecordings(options) {
    return await Recording.findAll(options);
  }

  async createRecording({ userId, start, end, filename }, notify = true) {
    try {
      const recording = await Recording.create({ userId, start: new Date(start), end: new Date(end), filename });
      if (notify) {
        this.logAndEmit(this.events.recording.create.success, recording);
      }
    } catch (err) {
      logger.error("Failed to create recording record: " + err);
    }
  }

  async updateRecording(recording, notify = true) {
    try {
      await recording.save();
      if (notify) {
        recording = await Recording.findByPk(recording.id);
        this.logAndEmit(this.events.recording.update.success, recording);
      }
    } catch (err) {
      logger.error("Failed to update recording record: " + err);
    }
  }

  async deleteRecording(recording, notify = true) {
    try {
      if (notify) recording = await Recording.findByPk(recording.id);
      await recording.destroy();
      if (notify) this.logAndEmit(this.events.recording.delete.success, recording);
    } catch (err) {
      logger.error("Failed to delete recording record: " + err);
    }
  }

  async deleteOldRecordings() {
    const deleteOlderThan = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let deletedRecordings = [];
    try {
      deletedRecordings = await Recording.findAll({
        where: {
          start: {
            [Op.lt]: deleteOlderThan,
          },
        },
      });

      await Recording.destroy({
        where: {
          start: {
            [Op.lt]: deleteOlderThan,
          },
        },
      });

      deletedRecordings.forEach(this.logAndEmit(this.events.recording.delete.success, recording));
    } catch (err) {
      logger.error("Failed to create recording record: " + err);
    }
  }
  // #endregion

  // #region Clips
  async getClip({ category, filename, fileModified }) {
    return (
      await Clip.findOrCreate({
        where: {
          category,
          filename,
        },
        defaults: {
          fileModified,
        },
      })
    )[0];
  }

  async createClip({ category, filename }) {
    // put in db
    const clip = await this.getClip({ category, filename, fileModified: new Date() });

    // send along
    this.logAndEmit(this.events.clip.create.success, clip);
  }

  async clipPlayed({ category, filename }) {
    const clip = await this.getClip({ category, filename });
    try {
      clip.lastPlayed = Date.now();
      clip.playCount += 1;
      await clip.save();

      this.logAndEmit(this.events.clip.update.success, clip);
    } catch (err) {
      logger.error("Failed to update clip: " + err);
    }
  }
  // #endregion

  // #region Consent
  async getConsent(userId) {
    return await Consent.findOne({
      order: [["createdAt", "DESC"]],
      where: {
        userId,
      },
    });
  }

  async createConsent({ userId, status }) {
    try {
      const oldConsent = await this.getConsent(userId);
      const consent = await Consent.create({ userId, status });
      // only fire events when consent status has changed
      if (oldConsent?.status !== status) {
        const eventType = this.events.consent[status];
        this.logAndEmit(eventType, consent);
      }
    } catch (err) {
      logger.error("Failed to create consent record: " + err);
    }
  }
  // #endregion
}

module.exports = new Persistence();
