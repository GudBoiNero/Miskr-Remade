const { AudioResource } = require("@discordjs/voice")

class Track {
    path = ''
    meta = undefined

    /**
     * 
     * @param {String} path 
     */
    constructor(path, meta) {
        this.path = path
        this.meta = meta
    }
}

module.exports = Track