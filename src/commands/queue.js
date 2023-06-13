const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const Globals = require("../globals.js");
const createThemedEmbed = require("../util/createThemedEmbed.js");
const { EmbedBuilder } = require("@discordjs/builders");

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

        const pageSize = 5
        const embeds = []

        if (!guildPlayer) return 

        const tracks = guildPlayer.queue.tracks
        const pages = ((tracks.length - tracks.length % pageSize) / pageSize) + Number((tracks.length % pageSize) > 0)
        
        // Split tracks into chunks of `pageSize`
        let currentPage = 1
        for (let i = 0; i < tracks.length; i += pageSize, currentPage++) {
            console.log('Index: '+i, '\n', 'Page: '+currentPage)
            const page = tracks.slice(i, i + pageSize);
            const embed = new EmbedBuilder().setTitle(`Queue (${currentPage}/${pages})`)
        }
        
    }
}