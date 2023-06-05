const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const { joinVoiceChannel, createAudioResource, StreamType, generateDependencyReport, entersState, VoiceConnectionStatus } = require('@discordjs/voice')
const Globals = require("../globals.js");
const GuildPlayer = require("../classes/GuildPlayer.js");
const Track = require('../classes/Track.js')
const ytdl = require('ytdl-core')
const ytsr = require('ytsr')
const path = require('path')
const fs = require('fs');
const Queue = require("../classes/Queue.js");
const { canUseVoiceCommand } = require("../util/voice.js");
const createThemedEmbed = require("../util/createThemedEmbed.js");

const validUrl = "https://www.youtube.com/watch?v=__id__"
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

        // Download
        const results = await ytsr(query, { "pages": 1 })
        
        const result = results.items[0]

        if (!result ? false : !result.id) {
            return await interaction.editReply({embeds: [createThemedEmbed("Error", 'Could not find a video', 'Error')]})
        }

        const filePath = path.join(dlPath, `${result.id}.ogg`)
        const fileUrl = validUrl.replace('__id__', result.id)

        let cont = async () => {
            // If there is already a GuildPlayer with an active connection.
            // Add the track to the queue
            let gp = Globals.getPlayer(guildId)
            if ((gp ? gp.connection != undefined : false) && !gp.destroyed) {
                gp.queue.addTrack(new Track(filePath, result))

                if (!interaction.replied) {
                    return await interaction.editReply({embeds: [createThemedEmbed("Util",`Added [${result.title}](${fileUrl}) to queue.`, 'Added to Queue')]})
                }
            }

            // Configure Globals
            const queue = new Queue([new Track(filePath, result)])
            const guildPlayer = new GuildPlayer(connection, guildId, queue)

            // Initialize player if it doesn't already exist
            Globals.setPlayer(guildId, guildPlayer)

            await guildPlayer.start()

            if (!interaction.replied) {
                await interaction.editReply({embeds: [createThemedEmbed("Action", `[${result.title}](${fileUrl})`, 'Now Playing:', result.bestThumbnail.url)]})
            }
        }

        if (fs.existsSync(filePath)) {
            await cont()
        } else {
            ytdl(fileUrl, { filter: 'audioonly', format: 'highestaudio' }).pipe(fs.createWriteStream(filePath)).on("finish", async () => {
                await cont()
            });
        }
    }
}