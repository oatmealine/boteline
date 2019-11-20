import {Client, PermissionResolvable, RichEmbed} from 'discord.js';
import * as Discord from 'discord.js';
const foxConsole = require('./foxconsole.js');

let client: Client;

function grammar(str: string) : string {
	const newstring = str.slice(1, str.length);
	return str[0].toUpperCase() + newstring;
}

import * as util from './util.js';

export class Command {
	public name: string;
	public function: Function;
	public usage: string;
	public displayUsage: string;
	public clientPermissions: PermissionResolvable[];
	public userPermissions: PermissionResolvable[];
	public needsDM: boolean;
	public needsGuild: boolean;
	public hidden: boolean;
	public ownerOnly: boolean;
	public description: string;
	public aliases: string[];
	public examples: string[];
	public usageCheck: Function;
	public ignorePrefix: boolean;
	public debugOnly: boolean;

	constructor(name : string, cfunction : Function) {
		this.name = name;
		this.function = cfunction;
		this.usage = name;
		this.displayUsage = name;
		this.clientPermissions = [];
		this.userPermissions = [];

		this.needsDM = false;
		this.needsGuild = false;

		this.hidden = false;
		this.ignorePrefix = false;
		this.debugOnly = false;
		this.ownerOnly = false;
		this.description = 'No description provided';

		this.aliases = [];
		this.examples = [];

		return this;
	}

	public setName(name) {
		this.name = name;
		return this;
	}

	public setUsage(usage : string) {
		this.usage = usage;
		this.displayUsage = usage;
		return this;
	}

	public setDisplayUsage(usage : string) {
		this.displayUsage = usage;
		return this;
	}

	public addExample(example : string) {
		this.examples.push(example);
		return this;
	}

	public addAlias(alias : string) {
		this.aliases.push(alias);
		return this;
	}

	public addAliases(aliases : string[]) {
		aliases.forEach((alias) => {
			this.addAlias(alias);
		});
		return this;
	}

	public setDescription(desc? : string) {
		this.description = desc === undefined ? 'No description provided' : desc;
		return this;
	}

	public setHidden(hide? : boolean) {
		this.hidden = hide === undefined ? true : hide;
		return this;
	}

	public setOwnerOnly(owner? : boolean) {
		this.ownerOnly = owner === undefined ? true : owner;
		return this;
	}

	public setDMOnly(needs?: boolean) {
		this.needsDM = needs === undefined ? true : needs;
		return this;
	}

	public setGuildOnly(needs?: boolean) {
		this.needsGuild = needs === undefined ? true : needs;
		return this;
	}

	public setDebugOnly(needs?: boolean) {
		this.debugOnly = needs === undefined ? true : needs;
		return this;
	}

	public setIgnorePrefix(needs?: boolean) {
		this.ignorePrefix = needs === undefined ? true : needs;
		return this;
	}

	public addClientPermission(perm) {
		if (Object.keys(Discord.Permissions.FLAGS).includes(perm)) {
			this.clientPermissions.push(perm);
		} else {
			foxConsole.warning('unknown permission ' + perm);
		}
		return this;
	}

	public addUserPermission(perm) {
		if (Object.keys(Discord.Permissions.FLAGS).includes(perm)) {
			this.userPermissions.push(perm);
		} else {
			foxConsole.warning('unknown permission ' + perm);
		}
		return this;
	}

	public addClientPermissions(perms : string[]) {
		perms.forEach((string) => {
			this.addClientPermission(string);
		});

		return this;
	}

	public addUserPermissions(perms : string[]) {
		perms.forEach((string) => {
			this.addUserPermission(string);
		});

		return this;
	}

	public runCommand(message: Discord.Message, client: Discord.Client) {
		const params = util.getParams(message);

		if (this.needsGuild && !message.guild) {
			return message.channel.send('This command needs to be ran in a server!');
		}

		if (this.needsDM && message.guild) {
			return message.channel.send('This command needs to be ran in a DM!');
		}

		let argumentsValid: boolean[] = [];

		if (this.usage && !this.usageCheck) {
			const argument = this.usage.split(' ');

			argument.forEach((arg, i) => {
				if (params[i] !== undefined) {
					switch (arg.slice(1, arg.length - 1)) {
					case 'any':
					case 'string':
						argumentsValid[i] = true;
						break;
					case 'url':
						argumentsValid[i] = params[i].startsWith('http://') || params[i].startsWith('https://');
						break;
					case 'number':
						argumentsValid[i] = !isNaN(Number(params[i]));
						break;
					case 'id':
						argumentsValid[i] = client ? Boolean((client.guilds.get(params[i]) || client.users.get(params[i]) || client.channels.get(params[i]))) : true;
					}
				} else {
					argumentsValid[i] = arg.startsWith('[') && arg.endsWith(']');
				}
			});
		} else {
			argumentsValid = this.usageCheck ? this.usageCheck(message) : null;
		}

		if (argumentsValid !== null) {
			if (argumentsValid.includes(false)) {
				return message.channel.send(`Invalid syntax! \`${this.name+' '+this.displayUsage}\``);
			}
		}

		if (this.userPermissions.length > 0 && message.guild && message.author.id !== process.env.OWNER) {
			const missingPermissions: PermissionResolvable[] = [];

			this.userPermissions.forEach((perm) => {
				if (!message.member.hasPermission(perm)) {
					missingPermissions.push(perm);
				}
			});

			if (missingPermissions.length > 0) {
				return message.channel.send(`**You can't run this command!** You need these permissions to use this command: \`${missingPermissions.join(', ')}\``);
			}
		}

		if (this.clientPermissions.length > 0 && message.guild) {
			const missingpermissions: PermissionResolvable[] = [];

			this.clientPermissions.forEach((perm) => {
				if (!message.guild.me.hasPermission(perm)) {
					missingpermissions.push(perm);
				}
			});

			if (missingpermissions.length > 0) {
				return message.channel.send(`**I can't run this command!** This bot need these permissions to run this command: \`${missingpermissions.join(', ')}\``);
			}
		}

		return this.function(message, client);
	}
}

export class SimpleCommand extends Command {
	constructor(name : string, cfunction : Function) {
		super(name, cfunction);

		this.function = (message, client) => {
			const returned: any  = cfunction(message, client);

			if (!returned) {
				foxConsole.warning('SimpleCommand returned nothing, please use Command class instead');
				return;
			}

			if (returned.then) { // check if its a promise or not
				returned.then((messageResult) => {
					return message.channel.send(messageResult);
				});
			} else {
				return message.channel.send(returned);
			}
		};
	}
}

export const commands = {};

export function addCommand(category, command : Command): void {
	foxConsole.debug('+ '+command.name)
	if (!module.exports.commands[category]) {
		module.exports.commands[category] = [];
	}

	module.exports.commands[category][command.name] = command;
}

addCommand('core', new SimpleCommand('help', (message) => {
	const params = message.content.split(' ');

	if (params[1]) {
		let command: Command;
		let categoryName: string;

		Object.values(module.exports.commands).forEach((category, i) => {
			if (command) { return; }

			categoryName = Object.keys(module.exports.commands)[i];

			Object.values(category).forEach((cmd) => {
				if (cmd.name === params[1] || cmd.aliases.includes(params[1])) {
					command = cmd;
				}
			});
		});

		if (command) {
			let embed = new Discord.RichEmbed()
				.setTitle(`**${grammar(command.name)}** (${grammar(categoryName)})`)
				.addField('Usage', command.name+' '+command.displayUsage)
				.setDescription(command.description)
				.setColor(Math.floor(Math.random() * 16777215));

			let commandExamplesPatched = command.examples.map(v => command.name+' '+v);

			if (command.examples.length !== 0) { embed = embed.addField('Examples', '`' + commandExamplesPatched.join('`,\n`') + '`'); }
			if (command.aliases.length !== 0) { embed = embed.addField('Aliases', command.aliases.join(', ')); }

			return embed;
		} else {
			let category: unknown;
			let categoryName: string;

			Object.values(module.exports.commands).forEach((cat, i) => {
				if (category) { return; }

				categoryName = Object.keys(module.exports.commands)[i];
				if (categoryName === params[1].toLowerCase()) { category = cat; }
			});

			if (category) {
				const embed: RichEmbed = new Discord.RichEmbed()
					.setTitle(`**${grammar(categoryName)}** [${Object.keys(category).length}]`)
					.setColor(Math.floor(Math.random() * 16777215));

				const commands: string[] = [];

				Object.values(category).forEach((cmd) => {
					if (!cmd.hidden) { commands.push('`' + cmd.name + '` - ' + cmd.description); }
				});

				if (commands.length !== 0) { embed.addField('Commands', commands.join('\n')); }

				return embed;
			} else {
				return `Command or category \`${params[1]}\` not found!`;
			}
		}
	} else {
		const embed = new Discord.RichEmbed()
			.setTitle('**All Boteline Commands**')
			.setColor(Math.floor(Math.random() * 16777215))
			.setFooter('Do help (category) to get all commands for a category!');

		Object.values(module.exports.commands).forEach((category, i) => {
			const categoryName = Object.keys(module.exports.commands)[i];
			const commands = [];

			Object.values(category).forEach((cmd) => {
				if (!cmd.hidden) { commands.push(cmd.name); }
			});

			if (commands.length !== 0) { embed.addField(`${grammar(categoryName)} [${commands.length}]`, '`' + commands.join('`, `') + '`'); }
		});

		return embed;
	}
})
	.setUsage('[string]')
	.setIgnorePrefix()
	.addAlias('cmds')
	.setDescription('see commands, or check out a comnmand in detail'));

addCommand('core', new Command('ping', (message, bot) => {
	const dateStart = Date.now();
	message.channel.send('hol up').then((m) => {
		m.edit(`Message latency: ${Date.now() - dateStart}ms\nWebsocket ping: ${Math.round(bot.ping)}ms`);
	});
})
	.setUsage('')
	.setDescription('ping the bot'));

export function setBot(bot: Client) {
	client = bot;
	bot['addCommand'] = addCommand;
	bot['commands'] = commands;
}