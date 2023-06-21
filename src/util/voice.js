const { CommandInteraction } = require("discord.js");
const { consoleColors } = require("./consoleColors");
const debug = require('../util/debug.js')

module.exports = {
    /**
     * @param {CommandInteraction} interaction
     * @returns {boolean}
     */
    async canUseVoiceCommand(
        interaction,
        requirements = {
            inSameVoiceChannel: true,
        }
    ) {
        const member = await interaction.guild.members.fetch(
            interaction.member.id
        );
        const voiceState = member?.voice;
        let canUse = true;

        if (
            !voiceState.channel ||
            !voiceState?.guild?.id == interaction.guild.id
        ) {
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply("You must be in a voice channel!");
            debug.log(consoleColors.FG_RED + "User not in channel or guild");
            canUse = false;
        } else if (
            !(
                interaction.guild.members.me.voice.channelId ==
                    voiceState.channelId ||
                interaction.guild.members.me.voice.channel == null
            ) &&
            requirements.inSameVoiceChannel
        ) {
            await interaction.deferReply({ ephemeral: true });
            await interaction.editReply(
                "You must be in the same voice channel as me!"
            );
            debug.log(consoleColors.FG_RED + "User not in same channel");
            canUse = false;
        }

        return canUse;
    },
};
