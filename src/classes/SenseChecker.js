const { CommandInteraction } = require("discord.js")

module.exports = {
    SenseChecker: class SenseChecker {
        /**
         * @param {CommandInteraction} interaction 
         */
        constructor(interaction) {
            this.interaction = interaction
        }

        /**
         * @returns {boolean}
         */
        canUseVoice() {
            // this.interaction

            /** 
             * CHECK: 
             *  - Is the player in a voice channel?
             *  - Is the player in the same voice channel as the bot?
             */ 

            return false
        }
    }
}