const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const Globals = require("../globals.js");
const createThemedEmbed = require("../util/createThemedEmbed.js");

module.exports = {
    isVoiceCommand: true,
    data: new SlashCommandBuilder().setName('skip')
        .addIntegerOption(option => {
            option.setName('number')
                .setMinValue(1)
                .setMaxValue(100)
                .setDescription('How many tracks would you like to skip')

            return option
        })
        .setDescription('...'),
    /**
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const guildId = interaction.guildId
        const guildPlayer = Globals.getPlayer(guildId)
        const skips = interaction.options.get('number')?.value

        if (guildPlayer) {
            let amtSkipped = 0
            for (let i = 0; i < (skips == undefined ? 1 : skips); i++) {
                amtSkipped++
                await guildPlayer.trackFinished()
            }

            await interaction.reply({embeds: [
                createThemedEmbed(
                    "Unimportant", 
                    '', 
                    `Skipped${amtSkipped > 1 ? ` ${amtSkipped}` : ''} Track${amtSkipped > 1 ? `s` : ''}`
                    )
                ]
            })
        } else {
            await interaction.reply({embeds: [createThemedEmbed("Error", 'Cannot skip the music if there is nothing playing!', 'Error')]})
        }
    }
}