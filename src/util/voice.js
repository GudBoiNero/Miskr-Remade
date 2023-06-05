const { CommandInteraction } = require("discord.js")

module.exports = {
    /**
     * @param {CommandInteraction} interaction 
     * @returns {boolean}
     */
    async canUseVoiceCommand(interaction) {
        const member = await interaction.guild.members.fetch(interaction.member.id);
        const voiceState = member?.voice

        await interaction.deferReply()
        
        if (!voiceState) {
            return await interaction.editReply('You must be in a voice channel!')
        }
        return false
    }
}