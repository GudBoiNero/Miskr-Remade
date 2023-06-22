const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const { joinVoiceChannel } = require('@discordjs/voice')
const Globals = require("../globals.js");
const GuildPlayer = require("../classes/GuildPlayer.js");
const Track = require('../classes/Track.js')
const path = require('path')
const Queue = require("../classes/Queue.js");
const createThemedEmbed = require("../util/createThemedEmbed.js");
const { consoleColors } = require("../util/consoleColors.js");
const debug = require("../util/debug.js");
const Downloader = require("../util/downloader.js");

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

        await interaction.deferReply()

        const connection = joinVoiceChannel({
            channelId: voiceState.channelId,
            guildId: voiceState.guild.id,
            adapterCreator: voiceState.guild.voiceAdapterCreator,
        });

        if (!connection) return

        const downloader = new Downloader(query, interaction)
        await downloader.start()

        //#region getting video metadata
        const metadata = downloader.metadata
        const tracks = []

        for (let index = 0; index < metadata.length; index++) {
            const video = metadata[index];
            const filePath = path.join(dlPath, video.id + '.ogg')
            const track = new Track(filePath, { result: video, channelId: interaction.channelId })
            tracks.push(track)
        }

        const queue = new Queue(tracks)
        debug.log(consoleColors.FG_GRAY + 'Running Queue...')

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

        await Globals.getPlayer(guildId).connection.rejoin()
        await interaction.editReply({ embeds: [createThemedEmbed("Action", `[${metadata.at(0).title}](${metadata.at(0).url})`, 'Now Playing:')] })
    }
}