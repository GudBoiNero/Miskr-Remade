const Queue = require('./Queue.js')
const { createAudioPlayer, VoiceConnection, NoSubscriberBehavior, VoiceConnectionStatus, createAudioResource, joinVoiceChannel, StreamType } = require('@discordjs/voice')

class GuildPlayer {
    player = createAudioPlayer()
    connection = VoiceConnection
    queue = new Queue()

    /**
     * @param {VoiceConnection} connection
     * @param {Queue} queue 
     */
    constructor(connection, queue = new Queue()) {
        this.connection = connection
        this.queue = queue
    }

    // This will make the Player immediately start playing the first resource in the Queue
    async start() {
        let track = this.queue.nextTrack()
        
        const playTrack = () => {
            const resource = createAudioResource(track.path, { inputType: StreamType.OggOpus, inlineVolume: true })
            this.connection.subscribe(this.player)
            this.player.play(resource)
        } 

        playTrack()

        this.connection.on('stateChange', (oldState, newState) => {
            console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
        });
        
        this.player.on('stateChange', (oldState, newState) => {
            console.log(`Audio player transitioned from ${oldState.status} to ${newState.status}`);
            if (newState.status == 'idle') {
                // Check if we should loop or continue to the next track
                if (!this.queue.options.looping) {
                    track = this.queue.nextTrack()
                    // If it's the end of the queue and we should not loop the queue
                    if (!track) {
                        return this.destroy()
                    }
                }
                playTrack()
            }
        });
    }

    get looping() {
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
     * @description Stops the audio player and returns the queue.
     * @returns {Queue}
     */
    destroy() {
        this.queue.reset()
        this.player.stop();
        this.connection.destroy();
        this.connection = undefined
        return this.queue;
    }
}

module.exports = GuildPlayer