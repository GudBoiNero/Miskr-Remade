const { CommandInteraction } = require("discord.js")

module.exports = {
    /**
     * @param {CommandInteraction} interaction 
     * @returns {boolean}
     */
    async canUseVoiceCommand(interaction) {
        const member = await interaction.guild.members.fetch(interaction.member.id);
        const voiceState = member?.voice

        if (!voiceState) {
            await interaction.reply('You must be in a voice channel!')
            return false
        }
        return true
    }
}