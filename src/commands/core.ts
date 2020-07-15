import * as CommandSystem from 'cumsystem';
import * as Discord from 'discord.js';
import * as util from '../lib/util';
import * as format from '../lib/format';
import * as discordutil from '../lib/discord';

const prefix = process.env.PREFIX;
let application: Discord.ClientApplication;

export function addCommands(cs: CommandSystem.System) {
	let guildSettings = cs.get('guildSettigs');
	let logger = cs.get('logger');
	let brandColor = cs.get('brandColor');

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
		const params = discordutil.getParams(msg);
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
		.setDescription('set a custom prefix for the bot to use')
		.setUsage('[string]')
		.addUserPermission('MANAGE_GUILD')
		.setGuildOnly());

	cs.addCommand(new CommandSystem.SimpleCommand('invite', () => {
		return `Invite me here: <https://discordapp.com/oauth2/authorize?client_id=${application.id}&scope=bot&permissions=314432>`;
	})
		.setCategory('core')
		.setDescription('get the bot\'s invite')
		.addAlias('invitelink'));

	cs.commands = cs.commands.filter(c => c.name !== 'help'); // remove help
	cs.addCommand(new CommandSystem.SimpleCommand('help', (message) => {
		const params = message.content.split(' ');

		if (params[1]) {
			let command: CommandSystem.Command;

			cs.commands.forEach(cmd => {
				if (command) { return; }

				if (cmd.name === params[1] || cmd.aliases.includes(params[1])) {
					command = cmd;
				}
			});

			if (command) {
				let embed = new Discord.MessageEmbed()
					.setTitle(`**${format.grammar(command.name)}** (${format.grammar(command.category)})`)
					.addField('Usage', cs.prefix + command.name + ' ' + command.displayUsage)
					.setDescription(command.description)
					.setColor(brandColor);

				let commandExamplesPatched = command.examples.map(v => cs.prefix + command.name + ' ' + v);

				if (command.examples.length !== 0) { embed = embed.addField('Examples', '`' + commandExamplesPatched.join('`,\n`') + '`'); }
				if (command.aliases.length !== 0) { embed = embed.addField('Aliases', '`' + command.aliases.join('`, `') + '`'); }

				return {embed};
			} else {
				let categoryCommands: CommandSystem.Command[] = cs.commands.filter(c => c.category === params[1].toLowerCase());

				if (categoryCommands.length === 0) return `Command or category \`${params[1]}\` not found!`;

				const embed = new Discord.MessageEmbed()
					.setTitle(`**${format.grammar(params[1].toLowerCase())}** [${categoryCommands.length}]`)
					.setColor(brandColor);

				embed.addField('Commands', categoryCommands.map(c => c.name).join('\n'));

				return {embed};
			}
		} else {
			const embed = new Discord.MessageEmbed()
				.setTitle('**All Commands**')
				.setColor(brandColor)
				.setFooter('Do help (category) to get all commands for a category!');

			let categorizedCommands: any = {};

			cs.commands.forEach(command => {
				if (!command.hidden) {
					if (!categorizedCommands[command.category]) categorizedCommands[command.category] = [];
					categorizedCommands[command.category].push(command);
				}
			});

			Object.keys(categorizedCommands).forEach(cat => {
				let commands = categorizedCommands[cat];

				if (commands.length !== 0)
					embed.addField(`${format.grammar(cat)} [${commands.length}]`,
						`\`${commands.map((c: CommandSystem.Command) => c.name.toLowerCase()).join('`, `')}\``);
			});

			return {embed};
		}
	})
		.setCategory('core')
		.setUsage('[string]')
		.setIgnorePrefix()
		.addAlias('cmds')
		.addClientPermission('EMBED_LINKS')
		.setDescription('see commands, or check out a comnmand in detail'));
}