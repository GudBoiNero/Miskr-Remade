const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const { joinVoiceChannel } = require('@discordjs/voice')
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
const {consoleColors} = require("../util/consoleColors.js");

const validVideoUrl = "https://www.youtube.com/watch?v=__id__"
const validPlaylistUrl = "https://www.youtube.com/playlist?list=__id__"
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

        //#region video code rework

        // Get all video ids.
        const videos = await (async() => {
            // Use ytsr to determine whether or not the result is a video or playlist and grab the ids based on the res
            const videos = []
            const results = await (async () => {try { return await ytsr(query, { "pages": 1 })} catch {}})()
            const result = results?.items[0]

            if (!result) return

            let resType = result.type
            if (resType == "video") {
                videos.push(result)
            } 
            else if (resType == "playlist") {
                // Get each individual id for each entry in a playlist
                const playlistVideos = await ytpl(results.originalQuery)
                playlistVideos.items?.forEach(video => {
                    // Get the item from the video url to ensure our `videos` are only of type `ytsr.Item`
                    ytsr(video.url, {pages: 1}).then(result => {
                        videos.push(result.items?.at(0))
                    })
                })
            }
            return videos
        })()

        if (videos.length === 0) {
            return await interaction.editReply({ embeds: [createThemedEmbed("Error", 'Could not find a video', 'Error')]})
        };

        videos.forEach(async (video, index) => {
            const url = validVideoUrl.replace('__id__', video)
            const filePath = path.join(dlPath, video.id) + '.ogg'
            // Check if we already downloaded it
            if (!fs.existsSync(filePath)) {
                ytdl(url, { filter: 'audioonly', format: 'highestaudio' }).pipe(fs.createWriteStream(filePath)).on("finish", async () => {
                    console.log(consoleColors.FG_GRAY+`Downloaded [${video?.title}]`)
                });
            } else { 
                console.log(consoleColors.FG_GRAY+`Already downloaded [${video?.title}]`)
            }
        })


        //#endregion

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