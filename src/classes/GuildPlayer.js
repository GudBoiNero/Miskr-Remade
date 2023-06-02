const {consoleColors} = require('../util/consoleColors.js')
const Queue = require('./Queue.js')
const { createAudioPlayer, VoiceConnection, NoSubscriberBehavior, VoiceConnectionStatus, createAudioResource, joinVoiceChannel, StreamType } = require('@discordjs/voice')
const Track = require('./Track.js')

class GuildPlayer {
    currentTrack = Track
    destroyed = false
    guildId = 0
    player = createAudioPlayer({behaviors:NoSubscriberBehavior.Stop})
    connection = VoiceConnection
    queue = new Queue()

    /**
     * @param {VoiceConnection} connection
     * @param {Queue} queue 
     */
    constructor(connection, guildId, queue = new Queue()) {
        this.guildId = guildId
        this.connection = connection
        this.queue = queue
    }

    // This will make the Player immediately start playing the first resource in the Queue
    async start() {
        if (this.destroyed) {
            return 
        }

        this.currentTrack = this.queue.nextTrack()
        
        const playTrack = () => {
            const resource = createAudioResource(this.currentTrack.path, { inputType: StreamType.OggOpus, inlineVolume: true })
            this.connection.subscribe(this.player)
            this.player.play(resource)
        } 

        playTrack()

        this.connection.on('stateChange', (oldState, newState) => {
            console.log(consoleColors.FG_GREEN+`Connection transitioned from ${oldState.status} to ${newState.status}`);
            if (oldState == 'ready' && newState == 'disconnected') {
                return this.disconnect()
            }
        });
        
        this.player.on('stateChange', (oldState, newState) => {
            console.log(consoleColors.FG_RED+`Audio player transitioned from ${oldState.status} to ${newState.status}`);
            if (newState.status == 'idle') {
                // Check if we should loop or continue to the next track
                if (!this.queue.options.looping) {
                    this.currentTrack = this.queue.nextTrack()
                    // If it's the end of the queue and we should not loop the queue
                    if (!this.currentTrack) {
                        return this.disconnect()
                    }
                }
                playTrack()
            }
        });
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
    }
}

module.exports = GuildPlayer