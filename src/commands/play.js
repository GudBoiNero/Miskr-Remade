const { SlashCommandBuilder, CommandInteraction, Embed, EmbedBuilder } = require("discord.js");
const { joinVoiceChannel, generateDependencyReport } = require('@discordjs/voice')
const Globals = require("../globals.js");
const GuildPlayer = require("../classes/GuildPlayer.js");
const Track = require('../classes/Track.js')
const ytdl = require('ytdl-core')
const ytpl = require('ytpl')
const ytsr = require('ytsr')
const path = require('path')
const fs = require('fs');
const Queue = require("../classes/Queue.js");
const createThemedEmbed = require("../util/createThemedEmbed.js");
const { consoleColors } = require("../util/consoleColors.js");

const validVideoUrl = "https://www.youtube.com/watch?v=__id__"
const dlPath = path.join('./', 'res/dl')

module.exports = {
    isVoiceCommand: true,
    data: new SlashCommandBuilder().setName('play')
        .addStringOption(option => {
            option.setName('query')
                .setRequired(true)
                .setDescription('The title of the youtube video.')

            return option
        })
        .setDescription('...'),
    /**
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const guildId = interaction.guildId
        const query = interaction.options.get('query')?.value
        const member = await interaction.guild.members.fetch(interaction.member.id);
        const voiceState = member?.voice

        interaction.deferReply()

        const connection = joinVoiceChannel({
            channelId: voiceState.channelId,
            guildId: voiceState.guild.id,
            adapterCreator: voiceState.guild.voiceAdapterCreator,
        });

        if (!connection) return

        /**
         * @returns {Embed}
         * @param {Number} current 
         * @param {Number} end 
         */
        const downloadEmbed = (current, end) => {
            const progBarLength = 25
            const percentage = (current / end) * progBarLength
            let res = ''

            for (let i = 0; i < progBarLength; i++) {
                res += (i / progBarLength) * progBarLength <= percentage ? '█' : ' '
            }

            return createThemedEmbed("Util", '``' + res + '``', `Downloading Video${end > 1 ? 's' : ''}!`)
        }
        /**
         * @returns {Embed}
         * @param {Number} current 
         * @param {Number} end 
         */
        const metaEmbed = (current, end) => {
            const progBarLength = 25
            const percentage = (current / end) * progBarLength
            let res = ''

            for (let i = 0; i < progBarLength; i++) {
                res += (i / progBarLength) * progBarLength <= percentage ? '█' : ' '
            }

            return createThemedEmbed("Unimportant", '``' + res + '``', `Getting Metadata...`);
        }

        //#region getting video metadata
        const videos = await (async () => {
            // Use ytsr to determine whether or not the result is a video or playlist and grab the ids based on the res
            let attempts = 0
            const MAX_ATTEMPTS = 10
            const videos = []
            let result
            let originalQuery

            console.log(consoleColors.FG_GRAY + `Searching for [${query}]`)
            while (!result && attempts < MAX_ATTEMPTS) {
                const results = await ytsr(query, { "pages": 1 })
                result = results?.items[0]
                originalQuery = results.originalQuery

                attempts++

                if (!result) {
                    console.log(consoleColors.FG_GRAY + `Retrying...`)
                } else {
                    console.log(consoleColors.FG_GRAY + `Found query in ${attempts} attempt${attempts > 1 ? 's' : ''}!`)
                }
            }

            if (!result) {
                console.log(consoleColors.FG_GRAY + `Could not find [${query}]`)
                return videos
            }

            let resType = result.type
            if (resType == "video") {
                videos.push(result)
                return videos
            }
            if (resType == "playlist") {
                // Get each individual id for each entry in a playlist
                const playlistVideos = await ytpl(originalQuery)

                for (let i = 0; i < playlistVideos.items.length; i++) {
                    const video = playlistVideos.items?.at(i);
                    const results = await ytsr(video.shortUrl, { limit: 1 })
                    const result = results.items?.at(0)

                    videos.push(result ?? video)

                    await interaction.editReply({ embeds: [metaEmbed(i, playlistVideos.items?.length)] })
                }
                return videos
            }
        })()
        //#endregion

        //#region download all videos and update the progress on the interaction
        if (videos?.length === 0) {
            return await interaction.editReply({ embeds: [createThemedEmbed("Error", 'Could not find a video or playlist!', 'Error')] })
        } else {
            await interaction.editReply({ embeds: [downloadEmbed(0, videos?.length)] })
        }

        let downloadedVideos = 0
        videos.forEach(async video => {
            const id = video?.id ?? video
            const url = validVideoUrl.replace('__id__', id)
            const filePath = path.join(dlPath, id) + '.ogg'
            // Check if we already downloaded it
            if (!fs.existsSync(filePath)) {
                ytdl(url, { filter: 'audioonly', format: 'highestaudio' }).pipe(fs.createWriteStream(filePath)).on("finish", async () => {
                    console.log(consoleColors.FG_GRAY + `Downloaded [${video?.title ?? url}](${url})`)
                    if (downloadedVideos >= videos?.length) { initPlayer() }
                })
            } else {
                console.log(consoleColors.FG_GRAY + `Already downloaded [${video?.title ?? url}](${url})`)
                if (downloadedVideos >= videos?.length) { initPlayer() }
            }

            // Display the progress
            downloadedVideos++
            await interaction.editReply({ embeds: [downloadEmbed(downloadedVideos, videos?.length)] })
        });

        //#region initialize queue and guild player
        const initPlayer = () => {
            const tracks = []
            for (let index = 0; index < videos.length; index++) {
                const video = videos[index];
                const filePath = path.join(dlPath, video.id + '.ogg')
                const track = new Track(filePath, { result: video, channelId: interaction.channelId })
                tracks.push(track)
            }
            const queue = new Queue(tracks)

            // Check if we don't already have a player
            const oldGuildPlayer = Globals.getPlayer(guildId)
            if ((oldGuildPlayer ? oldGuildPlayer.connection != undefined : false) && !oldGuildPlayer.destroyed) {
                oldGuildPlayer.queue.merge(queue)

                // Display all tracks added to queue

                return
            }

            const newGuildPlayer = new GuildPlayer(interaction.client, connection, guildId, queue)
            Globals.setPlayer(guildId, newGuildPlayer)
            newGuildPlayer.start()
        }


        //#endregion

        //#endregion

        /**let dlVideos = 0
        for (let index = 0; index < videos.length; index++) {
            const video = videos[index];
            const id = video?.id ?? video
            const url = validVideoUrl.replace('__id__', id)
            const filePath = path.join(dlPath, id) + '.ogg'
            // Check if we already downloaded it
            if (!fs.existsSync(filePath)) {
                ytdl(url, { filter: 'audioonly', format: 'highestaudio' }).pipe(fs.createWriteStream(filePath)).on("finish", async () => {
                    console.log(consoleColors.FG_GRAY+`Downloaded [${video?.title ?? url}](${url})`)
                });
            } else { 
                console.log(consoleColors.FG_GRAY+`Already downloaded [${video?.title ?? url}](${url})`)
            }

            // Display the progress
            dlVideos++
            await interaction.editReply({embeds: [downloadEmbed(dlVideos, videos?.length)]})
            
        }*/


        /*
        //#region old video play code
        // Download
        const results = await (async () => {
            try { return await ytsr(query, { "pages": 1 })} catch {}
        })()
        const result = results?.items[0]

        console.log(results)

        if (!result ?? (!result?.id || !result?.playlistID)) {
            return await interaction.editReply({embeds: [createThemedEmbed("Error", 'Could not find a video', 'Error')]})
        }

        const filePath = path.join(dlPath, `${result.id}.ogg`)
        const fileUrl = validVideoUrl.replace('__id__', result.id)

        const startPlayer = async () => {
            // If there is already a GuildPlayer with an active connection.
            // Add the track to the queue
            const curGuildPlayer = Globals.getPlayer(guildId)
            if ((curGuildPlayer ? curGuildPlayer.connection != undefined : false) && !curGuildPlayer.destroyed) {
                curGuildPlayer.queue.addTrack(new Track(filePath, result))

                if (!interaction.replied) {
                    return await interaction.editReply({embeds: [createThemedEmbed("Util",`Added [${result.title}](${fileUrl}) to queue.`, 'Added to Queue')]})
                }
            }

            // Configure Globals
            const queue = new Queue([new Track(filePath, {result: result, channelId: interaction.channelId})])
            const guildPlayer = new GuildPlayer(interaction.client, connection, guildId, queue)

            // Initialize player if it doesn't already exist
            Globals.setPlayer(guildId, guildPlayer)

            await guildPlayer.start()

            if (!interaction.replied) {
                await interaction.editReply({embeds: [createThemedEmbed("Action", `[${result.title}](${fileUrl})`, 'Now Playing:', result.bestThumbnail.url)]})
            }
        }

        // Checks if we already have the audio downloaded. IF so then just play it rather than downloading again.
        if (fs.existsSync(filePath)) {
            await startPlayer()
        } else {
            ytdl(fileUrl, { filter: 'audioonly', format: 'highestaudio' }).pipe(fs.createWriteStream(filePath)).on("finish", async () => {
                await startPlayer()
            });
        }
        //#endregion
        */
    }
}