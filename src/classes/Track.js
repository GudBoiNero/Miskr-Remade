const { AudioResource } = require("@discordjs/voice")

class Track {
    path = ''

    /**
     * 
     * @param {String} path 
     */
    constructor(path) {
        this.path = path
    }
}

module.exports = Track