const { EmbedBuilder } = require("@discordjs/builders")
const { Colors, Embed } = require("discord.js")

/**
 * 
 * @param {"Action" | "Unimportant" | "Util", "Error"} theme
 * @param {String} message 
 * @param {String} title
 * @param {String} image
 * @returns {Embed}
 */
module.exports = (
    theme,
    message,
    title,
    image
) => {
    const embed = new EmbedBuilder()

    if (message != '' && message) embed.setDescription(message);
    if (title != '' && title) embed.setTitle(title);
    if (image != '' && image) embed.setImage(image);

    embed.setTimestamp()

    switch (theme) {
        case "Action": embed.setColor(Colors.Blurple); break;
        case "Unimportant": embed.setColor(Colors.Greyple); break;
        case "Util": embed.setColor(Colors.Green); break;
        case "Error": embed.setColor(Colors.Red); break;
    }

    return embed
}