const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

const Config = require("../config");
const Persistence = require("../persistence");

const BaseDiscordService = require("./basediscordservice");
const DiscordVoice = require("./voice");

class RecordingChannel extends BaseDiscordService {
  // #region Event Handlers
  async onReady(client, server) {
    this.client = client;
    this.server = server;

    // get control channels
    this.recordingChannel = this.server.channels.resolve(Config.discordLogChannel);

    // set up event handlers
    this.client.on("interactionCreate", this.onInteractionCreate.bind(this));

    // set up recording logging
    if (this.recordingChannel) {
      Persistence.on(Persistence.events.recording.create.success, this.recordingCreated.bind(this));
      Persistence.on(Persistence.events.recording.update.success, this.recordingUpdated.bind(this));
      Persistence.on(Persistence.events.recording.delete.success, this.recordingDeleted.bind(this));
    }
  }

  async onInteractionCreate(interaction) {
    if (interaction.isButton()) {
      const parts = interaction.customId.split(".");
      if (parts[0] === "recording") {
        if (parts[1] === "play") {
          await DiscordVoice.playRecording(parts[2]);
          await interaction.reply({ content: "playing...", ephemeral: true });
        } else if (parts[1] === "save") {
          const recording = await Persistence.getRecording(parts[2]);
          await interaction.reply({ files: [recording.filename], ephemeral: true });
        } else if (parts[1] === "delete") {
          await Persistence.deleteRecording({ id: parts[2] });
          await interaction.reply({ content: "deleting...", ephemeral: true });
        }
      }
    }
  }
  // #endregion

  // #region Recording Channel
  async recordingCreated(recording) {
    const message = await this.recordingChannel.send({
      embeds: [await this.getRecordingMessageEmbed(recording)],
      components: [await this.getRecordingMessageControls(recording)],
    });

    recording.messageId = message.id;
    Persistence.emit(Persistence.events.recording.update.started, recording, false);
  }

  async recordingUpdated(recording) {
    if (!recording.messageId) return;
    let message = this.recordingChannel.messages.resolve(recording.messageId);
    if (!message) return;

    const embed = message.embeds.length === 1 ? message.embeds[0] : undefined;

    message = await message.edit({
      embeds: [await this.getRecordingMessageEmbed(recording, embed)],
    });

    recording.messageId = message.id;
    Persistence.emit(Persistence.events.recording.update.started, recording, false);
  }

  async recordingDeleted(recording) {
    if (!recording.messageId) return;
    let message = this.recordingChannel.messages.resolve(recording.messageId);
    if (!message) return;

    await message.delete();
  }

  STATUS_COLORS = {
    pending: "#4f5d7e",
    listening: "#f9a62b",
    completed: "#3da560",
    faulted: "#ec4145",
  };

  async getRecordingMessageEmbed(recording) {
    const member = this.server.members.resolve(recording.userId);

    let description;
    switch (recording.text) {
      case "":
        description = "_..._";
        break;
      case null:
      case undefined:
        description = "_pending_";
        break;
      default:
        description = recording.text;
        break;
    }

    return new EmbedBuilder()
      .setAuthor({
        name: member.displayName,
        iconURL: member.displayAvatarURL({ format: "png", dynamic: false, size: 32 }),
      })
      .setColor(this.STATUS_COLORS[recording.status])
      .setDescription(description);
  }

  async getRecordingMessageControls(recording) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("🔊 Play in Discord")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`recording.play.${recording.id}`),
      new ButtonBuilder()
        .setLabel("✂️ Clip")
        .setStyle(ButtonStyle.Link)
        .setURL(this.getRecordingClipLink(recording)),
      new ButtonBuilder()
        .setLabel("💾 Save")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`recording.save.${recording.id}`),
      new ButtonBuilder()
        .setLabel("❌ Delete")
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`recording.delete.${recording.id}`),
    );
  }
  // #endregion
}

module.exports = new RecordingChannel();
