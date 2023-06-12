const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const Globals = require("../globals.js");
const createThemedEmbed = require("../util/createThemedEmbed.js");

module.exports = {
    isVoiceCommand: true,
    data: new SlashCommandBuilder().setName('queue')
        .setDescription('...'),
    /**
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const guildId = interaction.guildId
        const guildPlayer = Globals.getPlayer(guildId)

        if (guildPlayer) {
            console.log(guildPlayer.queue.tracks)
        }
    }
}