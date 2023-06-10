const { EventEmitter } = require("events");
const { Client, GatewayIntentBits } = require("discord.js");

const Config = require("../config");
const Logger = require("../logger");

const intents = [
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.DirectMessageReactions,
];

class DiscordClient extends EventEmitter {
  constructor() {
    super();
    this.ready = false;

    this.client = new Client({ intents });
    this.server = null;

    // setup start and error handler
    this.client.on("ready", this.onReady.bind(this));

    // Say go
    this.client.login(Config.discordToken);
  }

  async onReady() {
    // Resolve server from id
    if (Config.discordServer) {
      try {
        this.server = await (await this.client.guilds.fetch(Config.discordServer)).fetch();
      } catch {
        Logger.error(`Unable to connect to server with id ${Config.discordServer}`);
      }
    }

    // if not found from id, just use first one
    if (this.server === null) {
      try {
        this.server = await (await this.client.guilds.fetch()).first().fetch();
      } catch {
        Logger.error("Not connected to any servers.");
        process.exit(1);
      }
    }

    // initial fetch of things
    await this.server.members.fetch();
    await this.server.channels.fetch();

    // set up event handlers
    this.client.on("rateLimit", this.onRateLimit.bind(this));
    this.client.on("error", this.onError.bind(this));

    // this allows us to rely on cache and not get rate limited
    this.client.on("guildMemberAdd", this.onMemberChange.bind(this));
    this.client.on("guildMemberRemove", this.onMemberChange.bind(this));
    this.client.on("guildMemberUpdate", this.onMemberChange.bind(this));

    this.client.on("channelCreate", this.onChannelChange.bind(this));
    this.client.on("ChannelDelete", this.onChannelChange.bind(this));
    this.client.on("channelUpdate", this.onChannelChange.bind(this));

    Logger.info(`Successfully connected to '${this.server.name}'`);

    this.ready = true;
    this.emit("ready", this.client, this.server);
  }

  async onRateLimit(data) {
    Logger.warn({msg: "Discord rate limited", data});
  }

  async onError(err) {
    Logger.warn({msg: "Discord error", err});
  }

  async onMemberChange(member) {
    if (member.guild.id === this.server.id) await this.server.members.fetch();
  }

  async onChannelChange(channel) {
    if (channel.guildId === this.server.id) await this.server.channels.fetch();
  }

  // tricky override such that listener is always called even if listener registered late
  on(eventName, listener) {
    if (this.ready) {
      listener(this.client, this.server);
    } else {
      super.on(eventName, listener);
    }
  }
}

module.exports = new DiscordClient();
