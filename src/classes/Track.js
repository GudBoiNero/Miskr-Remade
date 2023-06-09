const { AudioResource } = require("@discordjs/voice")
const ytsr = require("ytsr")

class Track {
    path = ''
    meta = {
        result: [],
        channelId: 0 // Used to send data when the track is being played
    }
    ended = true

    /**
     * 
     * @param {String} path 
     */
    constructor(path, meta) {
        this.path = path
        this.meta = meta
        this.ended = false
    }
}

module.exports = Track