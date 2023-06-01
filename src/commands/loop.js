const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const Globals = require("../globals.js");

module.exports = {
    data: new SlashCommandBuilder().setName('loop')
        .setDescription('...'),
    /**
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const guildId = interaction.guildId
        const guildPlayer = Globals.getPlayer(guildId)

        if (Globals.senseChecks(interaction)) {
            guildPlayer.loop(!guildPlayer.looping())
        }
    }
}