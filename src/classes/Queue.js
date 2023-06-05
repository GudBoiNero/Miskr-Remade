const Track = require('./Track.js')

module.exports = class Queue {
    tracks = []
    options = {
        looping: false,
        queueLooping: false
    }

    /**
     * @param {Track[]} tracks
     */
    constructor(tracks = [], options = {
        looping: false,
        queueLooping: false
    }) {
        this.options = options
        this.tracks = tracks
    }

    /**
     * @returns {Track | undefined}
     */
    nextTrack() {
        const track = this.tracks.shift()

        if (this.options.queueLooping) {
            this.tracks.push(track)
        }

        return track
    }

    /**
     * @param {Track} track 
     */
    addTrack(track) {
        this.tracks.push(track)
    }

    reset = () => this.tracks.slice(0, this.tracks.length - 1);
}

