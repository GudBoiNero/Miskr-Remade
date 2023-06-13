const Track = require('./Track.js')

module.exports = class Queue {
    tracks = [Track]
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
     * @param {Track} track 
     */
    addTrack(track) {
        this.tracks.push(track)
    }

    /**
     * @param {Queue} queue 
     */
    merge(queue) {
        for (let index = 0; index < queue.tracks.length; index++) {
            const track = queue.tracks[index];
            this.addTrack(track)
        }
    }

    reset = () => this.tracks.slice(0, this.tracks.length - 1);
}

