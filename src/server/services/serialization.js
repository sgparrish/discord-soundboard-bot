const DiscordClient = require("./discord/client");

class Serialization {
  constructor() {
    this.client = null;
    this.server = null;

    // setup start and error handler
    DiscordClient.on("ready", this.onReady.bind(this));
  }

  // #region Event Handlers
  async onReady(client, server) {
    this.client = client;
    this.server = server;
  }

  async toClipDTO({ category, filename, fileModified, lastPlayed, playCount }) {
    const clip = { category, filename, fileModified, lastPlayed, playCount };

    const member = (await this.server.members.resolve(category)) || null;
    if (member) {
      clip.member = {
        name: member.displayName,
        iconURL: member.displayAvatarURL({ format: "png", dynamic: false, size: 32 }),
      };
    }

    return clip;
  }

  async toRecordingDTO({ id, userId, start, end, text, status }) {
    const recording = { id, userId, start, end, text, status };

    const member = (await this.server.members.resolve(userId)) || null;
    if (member) {
      recording.member = {
        name: member.displayName,
        iconURL: member.displayAvatarURL({ format: "png", dynamic: false, size: 32 }),
      };
    }

    return recording;
  }
}

module.exports = new Serialization();
