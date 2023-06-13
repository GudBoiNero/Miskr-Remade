const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const Globals = require("../globals.js");
const createThemedEmbed = require("../util/createThemedEmbed.js");
const { EmbedBuilder } = require("@discordjs/builders");
const { PagesManager, PagesBuilder } = require('discord.js-pages')

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

        // Split tracks into chunks of `pageSize`
        let currentPage = 1
        for (let i = 0; i < tracks.length; i += pageSize, currentPage++) {
            //console.log('Index: '+i, '\n', 'Page: '+currentPage)
            const page = tracks.slice(i, i + pageSize);
            const embed = new EmbedBuilder().setTitle('Current Queue')
                .addFields({
                    name: '\t',
                    value: '**Playing:** ' + `[${guildPlayer.currentTrack.meta.result.title}](${guildPlayer.currentTrack.meta.result.url})`
                })

            page.forEach((track, index) => {
                embed.addFields({
                    name: '\t',
                    value:
                        `**${index + i + 1}:**` +
                        ` [${track.meta.result.title}](${track.meta.result.url})   ` +
                        `**${track.meta.result.duration}**`
                })
            })

            embeds.push(embed)
        }

        new PagesBuilder(interaction)
            .setTitle('Current Queue')
            .setPages(embeds)
            .setColor('Green')
            .build()
    }
}