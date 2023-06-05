const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const Globals = require("../globals.js");
const createThemedEmbed = require("../util/createThemedEmbed.js");

module.exports = {
    isVoiceCommand: true,
    data: new SlashCommandBuilder().setName('stop')
        .setDescription('...'),
    /**
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const guildId = interaction.guildId
        const guildPlayer = Globals.getPlayer(guildId)

        if (guildPlayer) {
            Globals.destroyPlayer(guildId)
            await interaction.reply({embeds: [createThemedEmbed("Unimportant", '', 'Stopped!')]})
        } else {
            await interaction.reply({embeds: [createThemedEmbed("Error", 'Cannot stop the music if nothing is playing!', 'Error')]})
        }
    }
}