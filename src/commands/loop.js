const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const Globals = require("../globals.js");

module.exports = {
    isVoiceCommand: true,
    data: new SlashCommandBuilder().setName('loop')
        .setDescription('...'),
    /**
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const guildId = interaction.guildId
        const guildPlayer = Globals.getPlayer(guildId)

        if (guildPlayer) {
            const looping = guildPlayer.looping()
            guildPlayer.loop(!looping)
            if (!looping) {
                await interaction.reply('Looping!')
            } else {
                await interaction.reply('Stopped looping!')
            }
            
        } else {
            await interaction.reply('Cannot loop if there is nothing playing!')
        }
    }
}