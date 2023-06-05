const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const Globals = require("../globals.js");

module.exports = {
    isVoiceCommand: true,
    data: new SlashCommandBuilder().setName('skip')
        .addIntegerOption(option => {
            option.setName('number')
                .setMinValue(1)
                .setMaxValue(100)
                .setDescription('How many tracks would you like to skip')

            return option
        })
        .setDescription('...'),
    /**
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const guildId = interaction.guildId
        const guildPlayer = Globals.getPlayer(guildId)
        const skips = interaction.options.get('number') | 1

        if (guildPlayer) {
            for (let i = 0; i < skips; i++) {
                guildPlayer.trackFinished()
            }
            await interaction.reply('Skipped!')
        } else {
            await interaction.reply('Cannot skip the music if there is nothing playing!')
        }
    }
}