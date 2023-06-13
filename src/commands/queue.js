const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const Globals = require("../globals.js");
const createThemedEmbed = require("../util/createThemedEmbed.js");
const { EmbedBuilder, inlineCode } = require("@discordjs/builders");
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
            const page = tracks.slice(i, i + pageSize);
            const embed = new EmbedBuilder().setTitle('Current Queue')
                .addFields(
                    {
                        name: '\u000b',
                        value: '`0:` ' + `[${guildPlayer.currentTrack.meta.result.title}](${guildPlayer.currentTrack.meta.result.url})`,
                        inline: true
                    },
                    { name: '\t', value: '`'+`${guildPlayer.currentTrack.meta.result.duration}`+'`', inline: true },
                    { name: '\u000B', value: '\u000B' }
                )

            page.forEach((track, index) => {
                embed.addFields(
                    {
                        name: `\t`,
                        value: '`'+`${i + index + 1}.`+'`'+` [${track.meta.result.title}](${track.meta.result.url})`,
                        inline: true
                    },
                    { name: '\t', value: '`'+`${track.meta.result.duration}`+'`', inline: true },
                    { name: '\u000B', value: '\u000B' }
                )
            })

            embeds.push(embed)
        }

        new PagesBuilder(interaction)
            .setTitle('Current Queue')
            .setPages(embeds)
            .setColor('Blurple')
            .setDefaultButtons(['back', 'next'])
            .build()
    }
}