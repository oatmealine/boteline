import * as CommandSystem from 'cumsystem';
import * as Discord from 'discord.js';
import * as util from '../lib/util';

const prefix = process.env.PREFIX;
let application: Discord.ClientApplication;

export function addCommands(cs: CommandSystem.System) {
	let guildSettings = cs.get('guildSettigs');
	let logger = cs.get('logger');

	cs.client.on('ready', () => {
		logger.info('fetching application...');
		cs.client.fetchApplication().then((app) => {
			application = app;
		});
	});

	cs.addCommand(new CommandSystem.Command('latencymeasure', async (msg) => {
		// testing
		let testingMessageSentAt = Date.now();
		const testingMessage: Discord.Message = await msg.channel.send('Measuring... [#\\_\\_\\_]');

		const sendMessageDelay = Date.now() - testingMessageSentAt;
	
		let messageEditedAt = Date.now();
		await testingMessage.edit('Measuring... [##\\_\\_]');

		const editMessageDelay = Date.now() - messageEditedAt;

		let messageReactedAt = Date.now();
		testingMessage.edit('Measuring... [###\\_]');
		await testingMessage.react('📶');

		const reactMessageDelay = Date.now() - messageReactedAt;

		let messageDeletedAt = Date.now();
		await testingMessage.delete();

		const deleteMessageDelay = Date.now() - messageDeletedAt;

		const averageDelay = util.roundNumber((sendMessageDelay + editMessageDelay + deleteMessageDelay + reactMessageDelay) / 5, 2);

		// send result back
		const embed = new Discord.MessageEmbed()
			.setTitle('Discord API Latency Measure')
			.addField('`MESSAGE_CREATE`', `${sendMessageDelay}ms of delay`)
			.addField('`MESSAGE_UPDATE`', `${editMessageDelay}ms of delay`)
			.addField('`MESSAGE_DELETE`', `${deleteMessageDelay}ms of delay`)
			.addField('`MESSAGE_REACTION_ADD`', `${reactMessageDelay}ms of delay`)
			.setDescription(`The average delay is ${averageDelay}ms`);

		msg.channel.send(embed);
	})
		.setCategory('core')
		.setGlobalCooldown(10000)
		.setDescription('measure the latency of the discord api')
		.addClientPermission('EMBED_LINKS')
		.addAlias('fancyping'));


	cs.addCommand(new CommandSystem.SimpleCommand('prefix', (msg) => {
		const params = util.getParams(msg);
		if (!params[0]) { params[0] = prefix; }

		params[0] = params[0].toLowerCase();

		if (guildSettings[msg.guild.id]) {
			guildSettings[msg.guild.id].prefix = params[0];
		} else {
			guildSettings[msg.guild.id] = {
				prefix: params[0],
			};
		}

		if (guildSettings[msg.guild.id].prefix === prefix) {
			delete guildSettings[msg.guild.id].prefix;
		}

		return `changed prefix to ${params[0]}`;
	})
		.setCategory('core')
		.addAlias('setprefix')
		.addAlias('customprefix')
		.setDescription('set a custom prefix for boteline')
		.setUsage('[string]')
		.addUserPermission('MANAGE_GUILD')
		.setGuildOnly());

	cs.addCommand(new CommandSystem.SimpleCommand('invite', () => {
		return `Invite me here: <https://discordapp.com/oauth2/authorize?client_id=${application.id}&scope=bot&permissions=314432>`;
	})
		.setCategory('core')
		.setDescription('get the bot\'s invite')
		.addAlias('invitelink'));
}