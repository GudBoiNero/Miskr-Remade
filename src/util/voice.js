const { CommandInteraction } = require("discord.js");
const { consoleColors } = require("./consoleColors");

module.exports = {
    /**
     * @param {CommandInteraction} interaction 
     * @returns {boolean}
     */
    async canUseVoiceCommand(interaction) {
        const member = await interaction.guild.members.fetch(interaction.member.id);
        const voiceState = member?.voice
        let canUse = true

        if (!voiceState.channel || !voiceState?.guild?.id == interaction.guild.id) {
            await interaction.deferReply({ephemeral: true})
            await interaction.editReply('You must be in a voice channel!')
            console.log(consoleColors.FG_RED+'User not in channel or guild')
            canUse = false
        } else if (!(interaction.guild.members.me.voice.channelId == voiceState.channelId)) {
            await interaction.deferReply({ephemeral: true})
            await interaction.editReply('You must be in the same voice channel as me!')
            console.log(consoleColors.FG_RED+'User not in same channel')
            canUse = false
        } 
        
        return canUse
    }
}