const { ChannelType } = require("discord.js");

const Config = require("../config");
const DiscordClient = require("./client");

class BaseDiscordService {
  constructor() {
    this.client = null;
    this.server = null;

    // ugly bindings to deal with javascript-ness
    this.isMe = this._isMe.bind(this);
    this.isNotMe = this._isNotMe.bind(this);

    // setup start and error handler
    DiscordClient.on("ready", this.onReady.bind(this));
  }

  // #region Utiltity
  _isMe(user) {
    return (
      (typeof user === "string" && user === this.client.user.id) ||
      (user && user.user && typeof user.user.id === "string" && user.user.id === this.client.user.id) ||
      (user && typeof user.id === "string" && user.id === this.client.user.id)
    );
  }

  _isNotMe(user) {
    return !this.isMe(user);
  }

  getWebappLink() {
    return `http://${Config.serverHostname}:${Config.serverPort}`;
  }

  getMessageLink(message) {
    return `https://discord.com/channels/${message.guildId}/${message.channelId}/${message.id}`;
  }

  getRecordingClipLink(recording) {
    return `${this.getWebappLink()}/clip/${recording.id}`;
  }

  getRecordingSaveLink(recording) {
    return `${this.getWebappLink()}/api/sounds/recordings/save/${recording.id}`;
  }

  async getMyChannel() {
    return this.server.channels.cache.find((channel) => channel.type === ChannelType.GuildVoice && channel.members.some(this.isMe)) || null;
  }

  async clearChannel(channel, filterFn) {
    let messages = [];

    // dm channels don't have bulkdelete
    if (typeof channel.bulkDelete === "function") {
      messages = await channel.messages.fetch();
      if (filterFn) messages = messages.filter(filterFn);
      await channel.bulkDelete(messages, true);
    }
    messages = await channel.messages.fetch();
    if (filterFn) messages = messages.filter(filterFn);
    await Promise.allSettled(messages.filter((message) => message.deletable).map((message) => message.delete()));
  }

  async getJoinableChannels() {
    return this.server.channels.cache.filter(
      (channel) =>
        channel.type === ChannelType.GuildVoice &&
        channel.joinable &&
        channel.speakable &&
        channel.id !== this.server.afkChannelID &&
        channel.members.filter(this.isNotMe).size > 0
    );
  }
  // #endregion
}

module.exports = BaseDiscordService;
