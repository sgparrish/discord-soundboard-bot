const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");

const Config = require("../config");
const ClipManager = require("../clipmanager");
const Persistence = require("../persistence");

const BaseDiscordService = require("./basediscordservice");
const DiscordVoice = require("./voice");

class ClipChannel extends BaseDiscordService {
  // #region Event Handlers
  async onReady(client, server) {
    this.client = client;
    this.server = server;

    // get control channels
    this.clipChannel = this.server.channels.resolve(Config.discordClipChannel);

    this.tableOfContents = null;
    this.clipMessages = null;

    // set up event handlers
    this.client.on("interactionCreate", this.onInteractionCreate.bind(this));

    // set up recording logging
    if (this.clipChannel) {
      Persistence.on(Persistence.events.clip.create.success, this.clipCreated.bind(this));
      Persistence.on(Persistence.events.clip.delete.success, this.clipDeleted.bind(this));
    }

    // set up control panels
    await this.buildClipChannel();
  }

  async onInteractionCreate(interaction) {
    if (interaction.isButton()) {
      const parts = interaction.customId.split(".");
      if (parts[0] === "clip") {
        if (parts[1] === "play") {
          const category = parts[2];
          const soundName = parts.slice(3).join(".");
          const filename = await ClipManager.getClipFile(category, soundName);
          await DiscordVoice.playFile(filename);
          await ClipManager.clipPlayed(category, soundName);
          await interaction.reply({ content: "playing...", ephemeral: true });
        }
      }
    }
  }

  async clipCreated(clip) {
    await this.updateClipCategory(clip.category);
  }
  async clipDeleted(clip) {
    await this.updateClipCategory(clip.category);
  }
  // #endregion

  // #region Clip Channel
  async buildClipChannel() {
    await this.clearChannel(this.clipChannel);

    const clips = await ClipManager.getClips();
    const categories = await this.getCategories(clips);

    this.tableOfContents = [];
    for (let i = 0; i < categories.length; i += 25) {
      const embeds = i === 0 ? [await this.getBoardTableOfContentsEmbed()] : undefined;
      const components = [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("placholder").setStyle(ButtonStyle.Secondary).setCustomId(`tableofcontents.${i}`)
        ),
      ];
      this.tableOfContents[i] = await this.clipChannel.send({ embeds, components });
    }

    this.clipMessages = {};
    for (let i = 0; i < categories.length; i++) {
      const payloads = await this.getBoardMessagePayloads(categories[i], this.tableOfContents);
      const messages = await Promise.all(payloads.map((payload) => this.clipChannel.send(payload)));

      this.clipMessages[categories[i].id] = messages;
    }

    const buttons = await this.getBoardTableOfContentsButtons(categories, this.clipMessages);
    const buttonSets = await this.getComponentRowSets(buttons);
    for (let i = 0; i < this.tableOfContents.length; i++) {
      await this.tableOfContents[i].edit({
        components: buttonSets[i],
      });
    }
  }

  // dynamically update existing messages to reflect updated clip set for category, (or rebuild entire soundboard)
  async updateClipCategory(categoryId) {
    const categoryMessages = this.clipMessages[categoryId];

    if (categoryMessages) {
      // attempt to edit existing messages to not rebuild entire board
      const clips = (await ClipManager.getClips()).filter((clip) => clip.category === categoryId);
      const category = (await this.getCategories(clips)).find((category) => category.id === categoryId);

      const payloads = await this.getBoardMessagePayloads(category, this.tableOfContents);
      if (categoryMessages.length !== payloads.length) {
        // not enough messages to fit all the buttons, just rebuild entire board
        await this.buildClipChannel();
        return;
      }
      const messages = await Promise.all(payloads.map((payload, i) => categoryMessages[i].edit(payload)));

      this.clipMessages[categoryId] = messages;
    } else {
      // this is a new category, rebuild entire board
      await this.buildClipChannel();
      return;
    }
  }

  async getBoardTableOfContentsEmbed() {
    return new EmbedBuilder()
      .setTitle("Discord Soundboard Bot")
      .setDescription(`[Webapp Link](${this.getWebappLink()})\nTable of contents`)
      .setColor("#ffffff");
  }

  async getBoardTableOfContentsButtons(categories, messages) {
    const buttons = [];
    for (let i = 0; i < categories.length; i++) {
      const { id, member } = categories[i];

      let label;
      if (member) {
        label = `${member.displayName}`;
      } else {
        label = id;
      }

      buttons[i] = new ButtonBuilder()
        .setLabel(label)
        .setStyle(ButtonStyle.Link)
        .setURL(this.getMessageLink(messages[id][0]));
    }
    return buttons;
  }

  async getBoardMessagePayloads(category, tableOfContents) {
    const buttons = await this.getBoardMessageButtons(category);
    const buttonSets = await this.getComponentRowSets(buttons);

    const categoryEmbed = await this.getBoardMessageEmbed(category, tableOfContents);

    return buttonSets.map((components, i) => ({ embeds: i === 0 ? [categoryEmbed] : undefined, components }));
  }

  async getBoardMessageEmbed({ id, member }, tableOfContents) {
    const embed = new EmbedBuilder()
      .setAuthor(
        member
          ? {
              name: `${member.displayName}#${member.user.discriminator}`,
              iconURL: member.displayAvatarURL({ format: "png", dynamic: false, size: 32 }),
            }
          : {
              name: `${id}`,
            }
      )
      .setDescription(`[Back to Top](${this.getMessageLink(tableOfContents[0])})`);
    return embed;
  }

  async getBoardMessageButtons({ id, sounds }) {
    const buttons = [];
    for (let i = 0; i < sounds.length; i++) {
      const { filename } = sounds[i];
      buttons[i] = new ButtonBuilder()
        .setLabel(`${filename.substring(0, filename.lastIndexOf("."))}`)
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(`clip.play.${id}.${filename}`);
    }
    return buttons;
  }

  async getComponentRowSets(buttons) {
    const componentRowSets = [];

    componentRowSets[0] = [];

    for (let i = 0; i < buttons.length; i++) {
      if (i % 25 === 0) componentRowSets[Math.floor(i / 25) % 5] = [];
      if (i % 5 === 0) componentRowSets[Math.floor(i / 25)][Math.floor(i / 5) % 5] = new ActionRowBuilder();
      componentRowSets[Math.floor(i / 25)][Math.floor(i / 5) % 5].addComponents(buttons[i]);
    }

    return componentRowSets;
  }
  // #endregion

  // #region Utility
  async getCategories(clips) {
    const clipGroups = clips.reduce((groups, clip) => {
      let group = groups.find((g) => g[0].category === clip.category);
      if (group === undefined) {
        group = [];
        groups.push(group);
      }
      group.push(clip);
      return groups;
    }, []);

    const categories = [];
    for (let i = 0; i < clipGroups.length; i++) {
      const id = clipGroups[i][0].category;
      const member = (await this.server.members.resolve(id)) || null;
      categories.push({
        id,
        member,
        sounds: clipGroups[i],
      });
    }
    return categories;
  }
  // #endregion
}

module.exports = new ClipChannel();
