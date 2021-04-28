const Discord = require("discord.js");
const FilesUtil = require("./filesutil");

class DiscordClient {
  constructor() {
    this.client = new Discord.Client();
    this.server = null;

    this.streams = new Map();

    // On client initialized
    this.client.on("ready", this.onReady.bind(this));

    // Say go
    this.client.login(process.env.DISCORD_BOT_TOKEN);
  }

  onReady() {
    // Resolve server from id, or just use first available
    this.client.guilds
      .fetch(process.env.DISCORD_BOT_SERVER)
      .then((guild) => (this.server = guild))
      .catch((this.server = Array.from(this.client.guilds.cache.values())[0]))
      .finally(() => {
        // Set up handlers
        this.client.on("message", this.onMessage.bind(this));
        this.client.on("guildMemberSpeaking", this.onMemberSpeaking.bind(this));

        // Clear old messages
        this.initializeMessages();

        // Setup channel check
        setInterval(this.checkChannels.bind(this), 1000 * 5);
      });
  }

  initializeMessages() {
    // welcome to level 1 of callback heck
    // this just deletes all messages the bot has sent to the owner user
    // then sends one with a reaction that can be used to kill the bot
    this.client.users
      .fetch(process.env.DISCORD_BOT_OWNER)
      .then((user) => user.createDM())
      .then((dmChannel) => {
        dmChannel.messages.fetch().then((messages) => {
          messages.forEach((message) => {
            if (message.deletable) message.delete();
          });
        });
        dmChannel
          .send(
            "s o u n d b o a r d operational. Press ❌ to exit. Press 🔌 to disconnect." + process.env.DISCORD_BOT_MSG
          )
          .then((message) => {
            message.react("❌");
            message
              .awaitReactions(
                (reaction, user) => reaction.emoji.name === "❌" && user.id === process.env.DISCORD_BOT_OWNER,
                { max: 1 }
              )
              .then((collected) => {
                if (collected.size >= 1) {
                  message
                    .delete()
                    .catch((err) => console.error("Delete msg failed: ", err))
                    .finally(() => {
                      this.client.destroy();
                      FilesUtil.killVosk();
                      process.exit();
                    });
                }
              })
              .catch((err) => console.error("❌ Collector failed: ", err));

            message.react("🔌");
            message
              .awaitReactions(
                (reaction, user) => reaction.emoji.name === "🔌" && user.id === process.env.DISCORD_BOT_OWNER,
                { max: 1 }
              )
              .then((collected) => {
                if (collected.size >= 1) {
                  this.disconnect();
                  this.initializeMessages();
                }
              })
              .catch((err) => console.error("🔌 Collector failed: ", err));
          })
          .catch((err) => console.error("Message failed: ", err));
      })
      .catch((err) => console.error("Resolving channel failed: ", err));
  }

  connect() {
    this.getMostPopulatedChannel()
      .join()
      .then(() => this.playSound(FilesUtil.getStartupSound()))
      .catch((err) => {
        console.error("Connect failed: ", err);
        this.disconnect();
      });
  }

  disconnect() {
    this.client.voice.connections.each((connection) => connection.disconnect());
  }

  onMessage(message) {
    // help
    if (message.channel.type === "dm" && message.author && message.author.id !== this.client.user.id) {
      message.channel.send(process.env.DISCORD_BOT_MSG);
    }
  }

  playSound(soundFile, callback) {
    const broadcast = this.client.voice.createBroadcast();
    const broadcastDispatcher = broadcast.play(soundFile);
    for (const connection of this.client.voice.connections.values()) {
      connection.play(broadcast);
    }
    broadcastDispatcher.on("finish", () => {
      broadcast.end();
      if (callback) callback();
    });
  }

  onMemberSpeaking(member, speaking) {
    if (
      this.client.user.id !== member.id && // never listen to yourself
      (speaking.has(Discord.Speaking.FLAGS.SPEAKING) || speaking.has(Discord.Speaking.FLAGS.PRIORITY_SPEAKING))
    ) {
      const connection = this.client.voice.connections.first();
      const stream = connection.receiver.createStream(member.id, {
        mode: "pcm",
        end: "silence",
      });
      FilesUtil.saveRecording(member, stream);
    }
  }

  getUserMetadata(userIds) {
    return Promise.allSettled(
      userIds.map((id) =>
        this.server.members
          .fetch(id)
          .then((member) => ({
            id: member.id,
            name: member.displayName,
            image: member.user.displayAvatarURL({ format: "png", dynamic: false, size: 32 }),
          }))
          .catch(() => ({ id }))
      )
    );
  }

  getJoinableChannels() {
    return Array.from(this.server.channels.cache.values()).filter(
      (channel) =>
        channel.type === "voice" &&
        channel.joinable &&
        channel.speakable &&
        channel.id !== this.server.afkChannelID &&
        channel.members.array().filter((member) => member.id !== this.client.user.id).length > 0
    );
  }

  getMostPopulatedChannel() {
    const channels = this.getJoinableChannels();
    channels.sort(
      (a, b) =>
        b.members.array().filter((member) => member.id !== this.client.user.id).length -
        a.members.array().filter((member) => member.id !== this.client.user.id).length
    );
    return channels[0];
  }

  checkChannels() {
    const voice = this.server.me.voice;
    if (voice.channel !== null && voice.channel.members.size === 1) {
      this.disconnect();
    } else if (voice.channel === null && this.getJoinableChannels().length > 0) {
      this.connect();
    }
  }
}

module.exports = DiscordClient;
