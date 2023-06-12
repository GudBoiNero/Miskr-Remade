const { createAudioPlayer, VoiceConnection, NoSubscriberBehavior, createAudioResource, StreamType, AudioResource } = require('@discordjs/voice')
const { CommandInteraction, Client } = require('discord.js')
const { AUTHORIZED_USERS } = require('../config.json')
const { consoleColors } = require('../util/consoleColors.js')

const Queue = require('./Queue.js')
const Track = require('./Track.js')
const events = require('events')
const Globals = require('../globals.js')
const createThemedEmbed = require('../util/createThemedEmbed.js')

class GuildPlayer {
    client = Client
    emitter = new events.EventEmitter()
    currentTrack = Track // Changed only when we're ready to play the next resource
    currentResource = AudioResource
    destroyed = false // This is only changed once. It should never be set to false after being set to true
    guildId = 0
    player = createAudioPlayer()
    connection = VoiceConnection // Must be set during constructur. Allows us to monitor the connection of the bot
    queue = new Queue() // Used to determine what the current tracks are and what the next track is
    volume = 1.0

    /**
     * @param {Client} client
     * @param {VoiceConnection} connection
     * @param {Queue} queue 
     */
    constructor(client, connection, guildId, queue = new Queue()) {
        this.client = client
        this.guildId = guildId
        this.connection = connection
        this.queue.merge(queue)
    }

    /**
     * This is the entry point for the GuildPlayer process. All control flow should be managed here
     * @returns {void}
     */
    async start() {
        if (this.destroyed) return;

        this.currentTrack = this.nextTrack()
        this.playTrack()

        this.connection.on('stateChange', (oldState, newState) => {
            // DEBUG
            // console.log(consoleColors.FG_YELLOW+`Connection transitioned from ${oldState.status} to ${newState.status}`); 

            // This should be whenever the bot finished playing it's resource.
            if (oldState.status == 'ready' && newState.status == 'disconnected') {
                return this.disconnect()
            } 
            
        });

        this.player.on('stateChange', async (oldState, newState) => {
            // DEBUG
            // console.log(consoleColors.FG_RED+`Audio player transitioned from ${oldState.status} to ${newState.status}`);

            // This should be directly after a bot finishes playing and it has another track to play.
            if (newState.status == 'idle') {
                // Check if we should loop or continue to the next track
                await this.trackFinished()
            }
        });
    }

    /**
     * @returns {Track | undefined}
     */
    nextTrack() {
        const track = this.queue.tracks.shift()

        if (this.queue.options.queueLooping) {
            this.queue.tracks.push(this.currentTrack)
        }

        return track
    }

    /**
     * Plays the current track
     */
    playTrack() {
        this.currentResource = createAudioResource(this.currentTrack.path, { inputType: StreamType.OggOpus, inlineVolume: true })
        this.currentResource.volume.setVolume(this.volume)
        this.player.play(this.currentResource)
        this.connection.subscribe(this.player)
    }

    /**
     * Merges two queues together
     * @param {Queue} queue
     */
    merge(queue) {
        this.queue.merge(queue)
        if (this.currentTrack.ended) {
            this.playTrack()
        }
    }

    /**
     * Sets the volume of the currently playing resource if any.
     * @param {Number} volume 
     * @param {CommandInteraction} interaction 
     */
    setVolume(volume, interaction) {
        const member = interaction.member

        this.volume = Math.min(1, Math.max(0, volume))

        this.currentResource.volume.setVolume(this.volume)
    }

    async trackFinished() {
        if (this.destroyed) return;
        this.currentTrack.ended = true
        // Check if we should loop or continue to the next track
        if (!this.queue.options.looping) {
            this.currentTrack = this.nextTrack()
            // If it's the end of the queue and we should not loop the queue
            if (!this.currentTrack) {
                return this.disconnect()
            }
        }
        this.playTrack()
    }

    looping() {
        return this.queue.options.looping
    }

    /**
     * @param {boolean} looping
     * @returns {void}
     */
    loop(looping = true) {
        this.queue.options.looping = looping
    }

    loopingQueue() {
        return this.queue.options.queueLooping
    }

    /**
     * @param {boolean} looping
     * @returns {void}
     */
    loopQueue(looping = true) {
        this.queue.options.queueLooping = looping
    }

    /**
     * @returns {Queue}
     */
    disconnect() {
        if (this.destroyed) return;

        console.log(consoleColors.FG_YELLOW+`Destroying GuildPlayer[${this.guildId}]!`)

        console.log(consoleColors.FG_GRAY+`Destroying GuildPlayer[${this.guildId}]...`)

        this.queue.reset()
        this.player.stop();
        this.connection.destroy();

        this.currentTrack = undefined
        this.destroyed = true

        this.emitter.emit('disconnected')
        console.log(consoleColors.FG_YELLOW+`Succesfully Destroyed GuildPlayer[${this.guildId}]!`)
    }
}

module.exports = GuildPlayer