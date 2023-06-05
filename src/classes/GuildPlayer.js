const Queue = require('./Queue.js')
const { createAudioPlayer, VoiceConnection, NoSubscriberBehavior, createAudioResource, StreamType, AudioResource } = require('@discordjs/voice')
const Track = require('./Track.js')
const { CommandInteraction } = require('discord.js')
const { AUTHORIZED_USERS } = require('../config.json')
const { emit } = require('process')
const events = require('events')
const Globals = require('../globals.js')
const { consoleColors } = require('../util/consoleColors.js')

class GuildPlayer {
    emitter = new events.EventEmitter()
    currentTrack = Track // Changed only when we're ready to play the next resource
    currentResource = AudioResource
    destroyed = false // This is only changed once. It should never be set to false after being set to true
    guildId = 0 
    player = createAudioPlayer({behaviors:NoSubscriberBehavior.Stop})
    connection = VoiceConnection // Must be set during constructur. Allows us to monitor the connection of the bot
    queue = new Queue() // Used to determine what the current tracks are and what the next track is

    /**
     * @param {VoiceConnection} connection
     * @param {Queue} queue 
     */
    constructor(connection, guildId, queue = new Queue()) {
        this.guildId = guildId
        this.connection = connection
        this.queue = queue
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
            //console.log(consoleColors.FG_GREEN+`Connection transitioned from ${oldState.status} to ${newState.status}`);
            // This should be whenever the bot finished playing it's resource.
            if (oldState == 'ready' && newState == 'disconnected') {
                return this.disconnect()
            }
        });
        
        this.player.on('stateChange', (oldState, newState) => {
            //console.log(consoleColors.FG_RED+`Audio player transitioned from ${oldState.status} to ${newState.status}`);
            // This should be directly after a bot finishes playing and it has another track to play.
            if (newState.status == 'idle') {
                // Check if we should loop or continue to the next track
                this.trackFinished()
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
        this.connection.subscribe(this.player)
        this.player.play(this.currentResource)
    } 

    /**
     * Sets the volume of the currently playing resource if any.
     * @param {Number} vol 
     * @param {CommandInteraction} interaction 
     */
    setVolume(vol, interaction) {
        const member = interaction.member

        if (!member.id in AUTHORIZED_USERS) {
            vol = Math.min(1, Math.max(0, vol))
        }

        this.currentResource.volume.setVolume(vol)
    }

    trackFinished() {
        if (this.destroyed) return;
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

        this.queue.reset()
        this.player.stop();
        this.connection.destroy();

        this.currentTrack = undefined
        this.destroyed = true
        
        this.emitter.emit('disconnected')

        console.log(consoleColors.FG_GRAY+`GuildPlayer ${this.guildId} Disconnected.`)
    }
}

module.exports = GuildPlayer