const fs = require('node:fs');
const path = require('node:path');

const { consoleColors } = require('./util/consoleColors.js')
const { Client, GatewayIntentBits, Collection, Events, REST, Routes } = require('discord.js')
const { CLIENT_TOKEN, CLIENT_ID } = require('./config.json');
const { canUseVoiceCommand } = require('./util/voice.js');
const { generateDependencyReport } = require('@discordjs/voice');
const debug = require("./util/debug.js")

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] })

//#region Dependency Report

debug.log(consoleColors.FG_GRAY+generateDependencyReport())

//#endregion

//#region Command Initialization
const commands = [];
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);

	commands.push(command.data.toJSON());

	if ('data' in command && 'execute' in command && 'isVoiceCommand' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(consoleColors.FG_RED + `[WARNING] The command at ${filePath} is missing a required "data", "execute", or "isVoiceCommand" property.`);
	}
}
//#endregion

//#region Deleting Downloads
const dlPath = path.join(__dirname, '../res/dl');
const dlFiles = fs.readdirSync(dlPath).filter(file => file.endsWith('.ogg') || file.endsWith('.webm') || file.endsWith('.wav'));

for (const file of dlFiles) {
	const filePath = path.join(dlPath, file);

	fs.rmSync(filePath, {force: true})
}
//#endregion

client.on(Events.ClientReady, async () => {
	console.log(consoleColors.FG_GREEN + 'Ready!')
})


client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		if ((command.isVoiceCommand && await canUseVoiceCommand(interaction)) || !command.isVoiceCommand) {
			await command.execute(interaction);
		};
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
})


//#region Constructing Commands
// Construct and prepare an instance of the REST module
const rest = new REST().setToken(CLIENT_TOKEN);

// and deploy your commands!
(async () => {
	try {
		debug.log(consoleColors.FG_GRAY + `Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		await rest.put(
			Routes.applicationCommands(CLIENT_ID),
			{ body: commands },
		);

		debug.log(consoleColors.FG_GRAY + `Successfully reloaded ${commands.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();
//#endregion

client.login(CLIENT_TOKEN)