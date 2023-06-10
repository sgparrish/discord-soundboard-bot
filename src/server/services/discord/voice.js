const path = require("node:path");
const { pipeline } = require("node:stream");
const { createWriteStream, mkdirSync } = require("node:fs");
const { mkdir } = require("node:fs/promises");

const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  EndBehaviorType,
  entersState,
  createAudioPlayer,
  NoSubscriberBehavior,
  createAudioResource,
  StreamType,
  SpeakingMap,
} = require("@discordjs/voice");
const { opus, FFmpeg } = require("prism-media");

const Config = require("../config");
const Logger = require("../logger");
const Persistence = require("../persistence");

const BaseDiscordService = require("./basediscordservice");

// ##### Giga Jank Here #####
// This value is used as a timeout period in ms for when a user is no longer considered talking
// Issues arise when this app takes too long to process the next packet, and the timeout has elapsed
// The user is considered to have stopped sppeaking and started again in the middle of a solid period of speaking
// The fun part is this value
SpeakingMap.DELAY = 500;

class DiscordVoice extends BaseDiscordService {
  constructor() {
    super();

    this.recordingDir = Config.recordingsDirectory;
    mkdirSync(this.recordingDir, { recursive: true });

    // Audio members
    this.connection = null;
    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });
    this.recordSound = this._recordSound.bind(this);
  }

  // #region Event Handlers
  async onReady(client, server) {
    this.client = client;
    this.server = server;

    // set up event handlers
    this.client.on("voiceStateUpdate", this.onVoiceStateUpdpate.bind(this));
  }

  async onVoiceStateUpdpate(oldState, newState) {
    if (this.isMe(newState.id)) return;

    let myChannel = await this.getMyChannel();
    if (myChannel !== null && myChannel.members.every(this.isMe)) {
      await this.disconnect();
      myChannel = null;
    }
    if (myChannel === null) {
      await this.connect();
    }
  }
  // #endregion

  // #region Utiltity
  async getMostPopulatedChannel() {
    const joinableChannels = await this.getJoinableChannels();

    if (joinableChannels.size === 0) return null;

    return await joinableChannels
      .sort((a, b) => b.members.filter(this.isNotMe).size - a.members.filter(this.isNotMe).size)
      .first()
      .fetch();
  }
  // #endregion

  // #region Voice
  async connect() {
    const channel = await this.getMostPopulatedChannel();
    if (channel === null) return;

    // Connect to channel
    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      selfDeaf: false,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    // Wait for connection to be ready
    await entersState(this.connection, VoiceConnectionStatus.Ready, 20e3);

    // Connect audio player to connection
    this.connection.subscribe(this.player);

    // hook up audio reciever events
    this.connection.receiver.speaking.on("start", this.recordSound);
  }

  async disconnect() {
    try {
      this.connection.destroy();
    } finally {
      this.conenction = null;
    }
  }

  async playRecording(id) {
    const recording = await Persistence.getRecording(id);
    await this.playFile(recording.filename);
  }

  async playFile(filename) {
    this.player.play(
      createAudioResource(filename, {
        inputType: StreamType.Arbitrary,
      })
    );
  }

  async _recordSound(userId) {
    const start = this.connection.receiver.speaking.users.get(userId);

    const opusStream = this.connection.receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: 100,
      },
    });

/*     const oggDemuxer = new opus.OggDemuxer();
    const oggDecoder = new opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 })
 */
    // ogg is an opus container
    const oggStream = new opus.OggLogicalBitstream({
      opusHead: new opus.OpusHead({
        channelCount: 2,
        sampleRate: 48000,
      }),
      pageSizeControl: {
        maxPackets: 10,
      },
    });

    // convert ogg to mp3
    const ffmpeg = new FFmpeg({
      args: ["-loglevel", "quiet", "-f", "ogg", "-i", "pipe:0", "-f", "mp3"],
    });

    const outPath = path.join(this.recordingDir, userId);
    await mkdir(outPath, { recursive: true });
    const filename = path.join(outPath, `${start}.mp3`);

    // opus => ogg => mp3 => file
    pipeline(opusStream, oggStream, ffmpeg, createWriteStream(filename), (err) => {
      if (err) {
        Logger.error(`Error recording file ${filename} - ${err.message}`);
      } else {
        const end = Date.now();
        Persistence.emit(Persistence.events.recording.create.started, { userId, start, end, filename });
      }
    });
  }
  // #endregion
}

module.exports = new DiscordVoice();
