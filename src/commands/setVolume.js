const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const Globals = require("../globals.js");
const createThemedEmbed = require("../util/createThemedEmbed.js");

module.exports = {
    isVoiceCommand: true,
    data: new SlashCommandBuilder().setName('set_volume')
        .addNumberOption(option => {
            option.setName('value')
                .setRequired(true)
                .setMinValue(0.0)
                .setMaxValue(5.0)
                .setDescription('The value to set the volume.')

            return option
        })
        .setDescription('...'),
    /**
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const guildId = interaction.guildId
        const guildPlayer = Globals.getPlayer(guildId)
        const vol = interaction.options.get('value')?.value

        if (guildPlayer) {
            guildPlayer.setVolume(vol)
            await interaction.reply({embeds: [createThemedEmbed("Unimportant", `Set volume to ${vol}`, 'Changed Volume!')]})
        } else {
            await interaction.reply({embeds: [createThemedEmbed("Error", 'Cannot change the volume if nothing is playing!', 'Error')]})
        }
    }
}