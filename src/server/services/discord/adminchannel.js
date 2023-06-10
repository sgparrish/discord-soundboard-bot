const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const Config = require("../config");
const BaseDiscordService = require("./basediscordservice");

class AdminChannel extends BaseDiscordService {
  // #region Event Handlers
  async onReady(client, server) {
    this.client = client;
    this.server = server;

    // set up event handlers
    this.client.on("interactionCreate", this.onInteractionCreate.bind(this));

    // set up control panels
    await this.buildOwnerChannel();
  }

  async onInteractionCreate(interaction) {
    if (interaction.isButton() && interaction.customId === "exit") {
      interaction.reply({ content: "bye", ephemeral: true });
    }
  }

  // #endregion

  // #region Menu Builders
  async buildOwnerChannel() {
    const owner = await this.client.users.resolve(Config.discordOwner);
    const dmChannel = await owner.createDM();

    await this.clearChannel(dmChannel);

    await dmChannel.send({
      /* content: `discord soundboard bot successfully started on ${this.server.name}.\n`, */
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("exit")
            .setLabel("Exit")
            .setStyle(ButtonStyle.Danger)
        ),
      ],
    });
  }
  // #endregion
}

module.exports = new AdminChannel();
