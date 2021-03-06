import * as CommandSystem from 'cumsystem';
import * as Discord from 'discord.js';
import * as util from '../lib/util';
import * as fs from 'fs';
import * as format from '../lib/format';
import * as discordutil from '../lib/discord';
import * as os from 'os';
import { Paginator } from '../lib/paginator';

const prefix = process.env.PREFIX;
let application: Discord.ClientApplication;

export function addCommands(cs: CommandSystem.System) {
	let guildSettings = cs.get('guildSettings');
	let logger = cs.get('logger');
	let brandColor = cs.get('brandColor');
	let userData = cs.get('userData');
	let botName = cs.get('botName');

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
	cs.addCommand(new CommandSystem.Command('help', (message) => {
		const params = message.content.split(' ');

		if (params[1] && params[1] !== 'hidden') {
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

				return message.channel.send(embed);
			} else {
				let categoryCommands: CommandSystem.Command[] = cs.commands.filter(c => c.category === params[1].toLowerCase());

				if (categoryCommands.length === 0) return message.channel.send(`Command or category \`${params[1]}\` not found!`);

				const embed = new Discord.MessageEmbed()
					.setTitle(`**${format.grammar(params[1].toLowerCase())}** [${categoryCommands.length}]`)
					.setColor(brandColor);

				embed.addField('Commands', categoryCommands.map(c => c.name).join('\n'));

				return message.channel.send(embed);
			}
		} else {
			let categorizedCommands: any = {};

			cs.commands.forEach(command => {
				if ((params[1] !== 'hidden' && !command.hidden) || (params[1] === 'hidden' && command.hidden)) {
					if (!categorizedCommands[command.category]) categorizedCommands[command.category] = [];
					categorizedCommands[command.category].push(command);
				}
			});

			let pages = Math.ceil(Object.keys(categorizedCommands).length / 5);

			let paginator = new Paginator((count) => {
				const embed = new Discord.MessageEmbed()
					.setTitle(`**All ${params[1] === 'hidden' ? 'Hidden ': ''}Commands**`)
					.setColor(brandColor)
					.setDescription('Do help (category) to get all commands for a category!')
					.setFooter(`${count}/${pages}`);

				let off = (count - 1) * 5;
				let commands = {};
				Object.keys(categorizedCommands).slice(0 + off, 5 + off).forEach(k => commands[k] = categorizedCommands[k]);

				Object.keys(commands).forEach(cat => {
					let commands = categorizedCommands[cat];

					if (commands.length !== 0)
						embed.addField(`${format.grammar(cat)} [${commands.length}]`,
							`\`${commands.map((c: CommandSystem.Command) => c.name.toLowerCase()).join('`, `')}\``);
				});

				return embed;
			}, message.author);

			paginator.setLimit(pages);
			return paginator.start(message.channel);
		}
	})
		.setCategory('core')
		.setUsage('[string]')
		.setIgnorePrefix()
		.addAlias('cmds')
		.addClientPermission('EMBED_LINKS')
		.setDescription('see commands, or check out a comnmand in detail'));

	cs.addCommand(new CommandSystem.Command('dumpdata', async (msg) => {
		if (!userData[msg.author.id]) return msg.channel.send('there isn\'t any data stored for your account');

		let fileName = `${os.tmpdir()}/${msg.author.id}.json`;
		fs.writeFileSync(fileName, JSON.stringify(userData[msg.author.id]));

		let dumpData = fs.statSync(fileName);
		await msg.channel.send(`${botName} user data dump - you can request another data dump in 1h\n\`\`\`for  : ${msg.author.id}\nat   : ${msg.createdAt}\nsize : ${format.formatFileSize(dumpData.size)}\`\`\``, new Discord.MessageAttachment(fileName));
		
		return fs.unlinkSync(fileName);
	})
		.setCategory('core')
		.setDescription('dumps all of your user data to you\ndata is served in JSON format, same as its stored')
		.setUserCooldown(60 * 60000) // 60 minutes
		.setGlobalCooldown(2000)
		.setDMOnly());

	cs.addCommand(new CommandSystem.Command('deletedata', async (msg) => {
		if (!userData[msg.author.id]) return msg.channel.send('there isn\'t any data stored for your account');

		await msg.channel.send('are you sure you want to delete all of your userdata? **this action is irreversible!!**\ntype in `y` to continue');
		let collector = msg.channel.createMessageCollector(() => true, {time: 30000})
			.on('collect', (msg) => {
				if (msg.content.toLowerCase() === 'y') {
					collector.stop('response');
					delete userData[msg.author.id];
					msg.channel.send('your userdata has been deleted ! :crab:');
				} else collector.stop();
			})
			.on('end', (c, reason) => {
				if (reason !== 'response') msg.channel.send('data deletion cancelled');
			});

		return collector;
	})
		.setCategory('core')
		.setUserCooldown(30000)
		.setDescription('delete all of your userdata - this is irreversible!!')
		.setDMOnly());
}