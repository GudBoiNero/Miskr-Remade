const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const Globals = require("../globals.js");
const createThemedEmbed = require("../util/createThemedEmbed.js");

module.exports = {
    isVoiceCommand: true,
    data: new SlashCommandBuilder().setName('loop_queue')
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
                await interaction.reply({embeds: [createThemedEmbed("Unimportant", '', 'Looping Queue!')]})
            } else {
                await interaction.reply({embeds: [createThemedEmbed("Unimportant", '', 'Stopped Looping Queue!')]})
            }
        } else {
            await interaction.reply({embeds: [createThemedEmbed("Error", 'Cannot loop the queue if nothing is playing!', 'Error')]})
        }
    }
}