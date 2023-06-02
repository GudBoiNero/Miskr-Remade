const { CommandInteraction } = require("discord.js");
const GuildPlayer = require("./classes/GuildPlayer");

let instance;
let cache = {
    players: {}
};

class GlobalState {
    constructor() {
        if (instance) {
            throw new Error("An instance of this already exists. Please use the singleton.");
        }

        instance = this;
    }

    get(propertyName) {
        return cache[propertyName];
    }

    set(propertyName, propertyValue) {
        cache[propertyName] = propertyValue;
    }

    /**
     * @param {CommandInteraction} interaction 
     * @returns {boolean}
     */
    async senseChecks(interaction) {
        const guildId = interaction.guildId
        const guildPlayer = this.getPlayer(guildId)

        const member = await interaction.guild.members.fetch(interaction.member.id);
        const voiceState = member?.voice

        // If the user is not in a voice channel
        if (!voiceState) {
            await interaction.reply('You must be in a voice channel!')
        }

        // If there is no active player
        if (!guildPlayer) {
            await interaction.reply('There is no active guild player!')
            return false
        } 

        return true
    }

    /**
     * 
     * @param {Number} guildId 
     * @returns {GuildPlayer | undefined}
     */
    getPlayer(guildId) {
        return Object.keys(cache.players).includes(guildId) ? cache.players[guildId] : undefined
    }

    getPlayers() {
        return cache.players
    }

    /**
     * @param {Number} guildId
     * @param {GuildPlayer} player
     */
    setPlayer(guildId, player) {
        if (this.getPlayer(guildId)) {
            this.getPlayer(guildId).disconnect()
        }
        cache.players[guildId] = player
    }

    /**
     * 
     * @param {Number} guildId 
     */
    destroyPlayer(guildId) {
        if (cache.players[guildId] != undefined) {
            delete cache.players[guildId]
        }
    }
}

let Globals = Object.freeze(new GlobalState());
module.exports = Globals;