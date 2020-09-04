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
    // Set up handlers
    this.client.on("message", this.onMessage.bind(this));
    this.client.on("guildMemberSpeaking", this.onMemberSpeaking.bind(this));

    // Clear old messages
    this.initializeMessages();

    // Join first available voice channel in first server
    this.server = Array.from(this.client.guilds.cache.values())[0];
    this.connect();
  }

  initializeMessages() {
    // welcome to level 1 of callback heck
    // this just deletes all messages the bot has sent to the owner user
    // then sends one with a reaction that can be used to kill the bot
    this.client.users
      .resolve(process.env.DISCORD_BOT_OWNER)
      .createDM()
      .then((dmChannel) => {
        dmChannel.messages.fetch().then((messages) => {
          messages.forEach((message) => {
            if (message.deletable) message.delete();
          });
        });
        dmChannel
          .send(
            "s o u n d b o a r d operational. Press ❌ to exit. Press 👋 to join your channel." +
              process.env.DISCORD_BOT_MSG
          )
          .then((message) => {
            message.react("❌");
            message
              .awaitReactions(
                (reaction, user) => reaction.emoji.name === "❌" && user.id === process.env.DISCORD_BOT_OWNER,
                { max: 1 }
              )
              .then((collected) => {
                message.delete().then(() => {
                  this.client.destroy();
                  process.exit();
                });
              });

            message.react("🔄");
            message
              .awaitReactions(
                (reaction, user) => reaction.emoji.name === "🔄" && user.id === process.env.DISCORD_BOT_OWNER,
                { max: 1 }
              )
              .then((collected) => {
                message.delete().then(() => {
                  this.initializeMessages();
                  this.client.voice.connections.each((connection) => connection.disconnect());
                  this.connect();
                });
              });
          });
      });
  }

  connect() {
    const channels = Array.from(this.server.channels.cache.values()).filter((c) => c.type === "voice" && c.joinable);
    channels.sort((a, b) => b.members.array().length - a.members.array().length);
    channels[0].join().then(() => this.playSound(FilesUtil.getStartupSound()));
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
    return new Promise((resolve, reject) => {
      resolve(
        userIds
          .map((id) => {
            const member = this.server.members.resolve(id);
            if (!member) return { id };
            return {
              id: member.id,
              name: member.displayName,
              image: member.user.displayAvatarURL({ format: "png", dynamic: false, size: 32 }),
            };
          })
          .filter((user) => user !== null)
      );
    });
  }
}

module.exports = DiscordClient;
