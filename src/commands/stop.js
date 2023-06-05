const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const Globals = require("../globals.js");

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
            await interaction.reply('Stopped!')
        } else {
            await interaction.reply('Cannot stop the music if there is nothing playing!')
        }
    }
}