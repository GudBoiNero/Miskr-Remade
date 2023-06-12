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
         * 
         * @param {Number} value 
         * @param {Number} end 
         * @param {{ fillchar: '█', emptychar: ' ' }} options 
         * @returns 
         */
        const progBar = (value, end, options = { fillchar: '█', emptychar: ' ', length: 25 }) => {
            const percentage = (value / end)
            const charPercentage = percentage * options.length
            let result = ''

            for (let i = 0; i < options.length; i++) {
                result += (i / options.length) * options.length <= charPercentage ? options.fillchar : options.emptychar
            }

            return '``' + result + '``' + ' ' + '``' + `${value}/${end}` + '``'
        }

        //#region getting video metadata
        const videos = await (async () => {
            // Use ytsr to determine whether or not the result is a video or playlist and grab the ids based on the res
            let attempts = 0
            const MAX_ATTEMPTS = 10
            const videos = []
            let result

            console.log(consoleColors.FG_GRAY + `Searching for [${query}]`)
            while (!result && attempts < MAX_ATTEMPTS) {
                const results = await ytsr(query, { "pages": 1 })
                result = results?.items[0]

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

            if (result.type == "video") {
                videos.push(result)
                return videos
            }
            if (result.type == "playlist") {
                // Get each individual id for each entry in a playlist
                const playlistVideos = await ytpl(result.playlistID)

                for (let i = 0; i < playlistVideos.items.length; i++) {
                    const video = playlistVideos.items?.at(i);
                    await interaction.editReply({ embeds: [createThemedEmbed("Util", progBar(i, playlistVideos.items?.length), `Loading Metadata!`)] })
                    
                    // result is a backup just in case we can't find anything at first
                    let result
                    ytsr(video.shortUrl, { limit: 1 }).then(results => {
                        result = results.items?.at(0)
                    })

                    videos.push(result ?? video)
                }
                return videos
            }
        })() ?? []
        //#endregion

        //#region initialize queue and guild player
        const initPlayer = async () => {
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
                oldGuildPlayer.merge(queue)
            }
            else {
                const newGuildPlayer = new GuildPlayer(interaction.client, connection, guildId, queue)
                Globals.setPlayer(guildId, newGuildPlayer)
                await newGuildPlayer.start()
            }
            await interaction.editReply({ embeds: [createThemedEmbed("Action", `[${videos.at(0).title}](${videos.at(0).url})`, 'Now Playing:')] })
        }
        //#endregion

        //#region download all videos and update the progress on the interaction
        if (videos?.length === 0) {
            return await interaction.editReply({ embeds: [createThemedEmbed("Error", 'Could not find a video or playlist!', 'Error')] })
        } else {
            await interaction.editReply({ embeds: [createThemedEmbed("Util", progBar(0, videos?.length), `Downloading Video${videos?.length > 1 ? 's' : ''}!`)] })
        }

        let downloadedVideos = 0
        videos.forEach(async video => {
            const id = video?.id ?? video
            const url = validVideoUrl.replace('__id__', id)
            const filePath = path.join(dlPath, id) + '.ogg'
            
            // Check if we already downloaded it
            if (!fs.existsSync(filePath)) {
                const download = ytdl(url, { filter: 'audioonly', format: 'highestaudio' })
                const pipe = download.pipe(fs.createWriteStream(filePath))

                pipe.on("finish", async () => {
                    console.log(consoleColors.FG_GRAY + `Downloaded [${video?.title ?? url}](${url})`)

                    // This if statement is meant to make sure we don't play audio that isn't fully downloaded yet
                    if (downloadedVideos >= videos?.length - 1) { await initPlayer() }
                })
            } else {
                console.log(consoleColors.FG_GRAY + `Already downloaded [${video?.title ?? url}](${url})`)
                if (downloadedVideos >= videos?.length - 1) { await initPlayer() }
            }
            

            // Display the progress
            downloadedVideos++
            await interaction.editReply({ embeds: [createThemedEmbed("Util", progBar(downloadedVideos, videos?.length), `Downloading Video${videos?.length > 1 ? 's' : ''}!`)] })
        });
        //#endregion
    }
}