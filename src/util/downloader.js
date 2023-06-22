const { CommandInteraction } = require("discord.js");
const {consoleColors} = require('../util/consoleColors')
const ytsr = require('ytsr')
const createThemedEmbed = require('../util/createThemedEmbed')
const progressBar = require('../util/progressBar')
const debug = require('../util/debug')
const path = require('path')
const ytdl = require('ytdl-core')
const fs = require('fs')
const validVideoUrl = "https://www.youtube.com/watch?v=__id__"
const dlPath = path.join('./', 'res/dl')

class Downloader {
    /**
     * @param {String} query 
     * @param {CommandInteraction} interaction
     */
    constructor(query, interaction) {
        this.query = query
        this.interaction = interaction
        this.metadata = []
    }

    async start() {
        this.metadata = await this.getMetadata(this.query)
        return this.download(this.metadata)
    }

    /**
     * 
     * @param {Array} metadata 
     * @returns {Promise<ytsr.Item>}
     */
    async download(metadata) {
        if (metadata?.length === 0) {
            return await this.interaction.editReply({ embeds: [createThemedEmbed("Error", 'Could not find a video or playlist!', 'Error')] })
        } else {
            await this.interaction.editReply({ embeds: [createThemedEmbed("Util", progressBar(0, metadata?.length), `Downloading Video${metadata?.length > 1 ? 's' : ''}!`)] })
        }

        let finished = 0;
        const downloads = metadata.map(
            (video) => new Promise(async (resolve, reject) => {
                const id = video?.id ?? video
                const url = validVideoUrl.replace('__id__', id)
                const filePath = path.join(dlPath, id) + '.ogg'

                const download = ytdl(url, { filter: 'audioonly', format: 'highestaudio' })
                const pipe = download.pipe(fs.createWriteStream(filePath))

                pipe.on("finish", async () => {
                    finished++
                    debug.log(consoleColors.FG_GRAY + `Downloaded [${video?.title ?? url}](${url})`)
                    await this.interaction.editReply({ embeds: [createThemedEmbed("Util", progressBar(finished, metadata?.length), `Downloading Video${metadata?.length > 1 ? 's' : ''}!`)] })
                })

                pipe.on("close", resolve)
                pipe.on("error", reject)
            }))

        return Promise.all(downloads);
    }

    /**
     * 
     * @param {String} query 
     */
    async getMetadata(query) {
        // Use ytsr to determine whether or not the result is a video or playlist and grab the ids based on the res
        const MAX_ATTEMPTS = 10
        const metadata = []

        let attempts = 0
        let result

        debug.log(consoleColors.FG_GRAY + `Searching for [${query}]`)
        while (!result && attempts < MAX_ATTEMPTS) {
            const results = await ytsr(query, { "pages": 1 })
            result = results?.items[0]

            attempts++

            if (!result) {
                debug.log(consoleColors.FG_GRAY + `Retrying...`)
            } else {
                debug.log(consoleColors.FG_GRAY + `Found query in ${attempts} attempt${attempts > 1 ? 's' : ''}!`)
            }
        }

        if (!result) {
            console.log(consoleColors.FG_GRAY + `Could not find [${query}]`)
            return metadata
        }

        if (result.type == "video") {
            metadata.push(result)
            return metadata
        }
        if (result.type == "playlist") {
            // Get each individual id for each entry in a playlist
            const playlistVideos = await ytpl(result.playlistID)

            for (let i = 0; i < playlistVideos.items.length; i++) {
                const video = playlistVideos.items?.at(i);
                await this.interaction.editReply({ embeds: [createThemedEmbed("Util", progressBar(i, playlistVideos.items?.length), `Loading Metadata!`)] })

                // result is a backup just in case we can't find anything at first
                let result
                ytsr(video.shortUrl, { limit: 1 }).then(results => {
                    result = results.items?.at(0)
                })

                metadata.push(result ?? video)
            }
            return metadata
        }
    }
}

module.exports = Downloader