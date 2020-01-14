/* eslint-disable no-unused-vars */
import * as Discord from 'discord.js';
import * as foxConsole from './foxconsole.js';
import * as util from './util.js';

function grammar(str: string) : string {
	const newstring = str.slice(1, str.length);
	return str[0].toUpperCase() + newstring;
}

let client : Discord.Client;
let prefix = 'm=';

/**
 * represents a command the bot can run (for example, a help command)be ran in a server
 */
export class Command {
	public name: string;
	public cfunc: (message: Discord.Message, client: Discord.Client) => any | undefined;
	public description: string;

	public usage: string;
	public displayUsage: string;

	public clientPermissions: Discord.PermissionResolvable[];
	public userPermissions: Discord.PermissionResolvable[];
	public needsDM: boolean;
	public needsGuild: boolean;

	public hidden: boolean;
	public ownerOnly: boolean;
	public ignorePrefix: boolean;
	public debugOnly: boolean;

	public aliases: string[];
	public examples: string[];

	public usageCheck: Function;

	public globalCooldown : number;
	public userCooldown : number;
	private globalCooldowns : number = 0;
	private userCooldowns : Object = {};

	/**
	 * create a command
	 * @param {string} name the name, also what invokes the command
	 * @param {function} cfunction the function to run after the command is ran
	 */
	constructor(name : string, cfunction : (message: Discord.Message, client: Discord.Client) => any | null) {
		this.name = name;
		this.cfunc = cfunction;
		this.usage = '';
		this.displayUsage = '';
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
		
		this.globalCooldown = 0;
		this.userCooldown = 0;

		return this;
	}

	/**
	 * change the command name
	 * @param {string} name the name to use for the command
	 */
	public setName(name : string) {
		this.name = name;
		return this;
	}

	/**
	 * changes the usage for parsing the command
	 * ex. usage: (string) (number) [any]
	 * @param {string} usage the usage, use () for necessary and [] for optional arguments
	 */
	public setUsage(usage : string) {
		this.usage = usage;
		this.displayUsage = usage;
		return this;
	}

	/**
	 * changes the usage in the help command. isnt parsed
	 * @param {string} usage the usage
	 */
	public setDisplayUsage(usage : string) {
		this.displayUsage = usage;
		return this;
	}

	/**
	 * add an example usage to the command
	 * ex: 20 text
	 * @param {string} example an example usage of the command
	 */
	public addExample(example : string) {
		this.examples.push(example);
		return this;
	}

	/**
	 * adds an alias which the command can be invoked with
	 * @param {string} alias the name of the alias
	 */
	public addAlias(alias : string) {
		this.aliases.push(alias);
		return this;
	}

	/**
	 * adds aliases which the command can be invoked with
	 * @param {string[]} aliases an array of alias names
	 */
	public addAliases(aliases : string[]) {
		aliases.forEach((alias) => {
			this.addAlias(alias);
		});
		return this;
	}

	/**
	 * sets the command's decription, display only
	 * @param {string} desc the description, leave empty to remove
	 */
	public setDescription(desc? : string) {
		this.description = desc === undefined ? 'No description provided' : desc;
		return this;
	}

	/**
	 * change the command's visibility in the help command
	 * @param {boolean} hide
	 */
	public setHidden(hide? : boolean) {
		this.hidden = hide === undefined ? true : hide;
		return this;
	}

	/**
	 * set the command to be ran as owner only
	 * @param {boolean} owner 
	 */
	public setOwnerOnly(owner? : boolean) {
		this.ownerOnly = owner === undefined ? true : owner;
		return this;
	}

	/**
	 * set whether the command is able to be ran outside dms or not
	 * @param {boolean} needs 
	 */
	public setDMOnly(needs?: boolean) {
		this.needsDM = needs === undefined ? true : needs;
		return this;
	}

	/**
	 * set whether the command is able to be ran outside servers or not
	 * @param {boolean} needs 
	 */
	public setGuildOnly(needs?: boolean) {
		this.needsGuild = needs === undefined ? true : needs;
		return this;
	}

	/**
	 * set whether the command is able to be ran outside debug mode
	 * @param {boolean} needs 
	 */
	public setDebugOnly(needs?: boolean) {
		this.debugOnly = needs === undefined ? true : needs;
		return this;
	}

	/**
	 * set whether the command ignores any given custom prefixes (only really useful for commands that change the prefix)
	 * @param {boolean} needs
	 */
	public setIgnorePrefix(needs?: boolean) {
		this.ignorePrefix = needs === undefined ? true : needs;
		return this;
	}

	/**
	 * add a permission required for the client to run the command
	 * @param {Discord.PermissionResolvable} perm the permission to add
	 */
	public addClientPermission(perm) {
		if (Object.keys(Discord.Permissions.FLAGS).includes(perm)) {
			this.clientPermissions.push(perm);
		} else {
			foxConsole.warning('unknown permission ' + perm);
		}
		return this;
	}

	/**
	 * add a permission required for the user to invoke the command
	 * @param {Discord.PermissionResolvable} perm the permission to add
	 */
	public addUserPermission(perm) {
		if (Object.keys(Discord.Permissions.FLAGS).includes(perm)) {
			this.userPermissions.push(perm);
		} else {
			foxConsole.warning('unknown permission ' + perm);
		}
		return this;
	}

	/**
	 * add multiple permissions required for the client to run the command
	 * @param {Discord.PermissionResolvable[]} perms an array of permissions to add
	 */
	public addClientPermissions(perms : string[]) {
		perms.forEach((string) => {
			this.addClientPermission(string);
		});

		return this;
	}

	/**
	 * add multiple permissions required for the user to invoke the command
	 * @param {Discord.PermissionResolvable[]} perms an array of permissions to add
	 */
	public addUserPermissions(perms : string[]) {
		perms.forEach((string) => {
			this.addUserPermission(string);
		});

		return this;
	}

	/**
	 * set a per-user cooldown on the command to prevent it from being spammed
	 * @param {number} time the cooldown in ms
	 */
	public setUserCooldown(time : number) {
		this.userCooldown = time;
		return this;
	}

	/**
	 * set a global cooldown on the command to prevent it from being spammed
	 * @param {number} time the cooldown in ms
	 */
	public setGlobalCooldown(time : number) {
		this.globalCooldown = time;
		return this;
	}

	/**
	 * check if you can run the command with a message, and if so run it
	 * @param {Discord.Message} message the message that invoked the command
	 * @param {Discord.Client} client the client of the bot that recieved the command
	 */
	public runCommand(message: Discord.Message, client: Discord.Client) {
		const params = util.getParams(message);

		if (this.needsGuild && !message.guild) {
			return message.channel.send('This command needs to be ran in a server!');
		}

		if (this.needsDM && message.guild) {
			return message.channel.send('This command needs to be ran in a DM!');
		}
		
		if (this.userCooldown > 0) {
			if (this.userCooldowns[message.author.id] === undefined || Date.now() - this.userCooldowns[message.author.id] > 0) {
				this.userCooldowns[message.author.id] = this.userCooldown;
			} else {
				return message.react('⏱️');
			}
		}

		if (this.globalCooldown > 0) {
			if ((Date.now() - this.globalCooldowns) > 0) {
				this.globalCooldowns = Date.now() + this.globalCooldown;
			} else {
				return message.react('⏱️');
			}
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
					case 'user':
						argumentsValid[i] = util.parseUser(client, params[i], message.guild === null ? undefined : message.guild) !== null;
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
			const missingPermissions: Discord.PermissionResolvable[] = [];

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
			const missingpermissions: Discord.PermissionResolvable[] = [];

			this.clientPermissions.forEach((perm) => {
				if (!message.guild.me.hasPermission(perm)) {
					missingpermissions.push(perm);
				}
			});

			if (missingpermissions.length > 0) {
				return message.channel.send(`**I can't run this command!** This bot need these permissions to run this command: \`${missingpermissions.join(', ')}\``);
			}
		}

		return this.cfunc(message, client);
	}
}

/**
 * a command the function of which returns the message to sent back
 * @extends Command
 */
export class SimpleCommand extends Command {
		/**
	 * create a command
	 * @param {string} name the name, also what invokes the command
	 * @param {Function} cfunction the function to run after the command is ran, returns a string that will be sent back to the user
	 */
	constructor(name : string, cfunction : (message: Discord.Message, client: Discord.Client) => any | undefined) {
		super(name, cfunction);

		this.cfunc = (message, client) => {
			const returned: any  = cfunction(message, client);

			if (!returned) {
				foxConsole.warning('SimpleCommand returned nothing, please use Command class instead');
				return null;
			}

			if (returned.then) { // check if its a promise or not
				returned.then(messageResult => {
					return message.channel.send(messageResult);
				});
			} else {
				return message.channel.send(returned);
			}

			return null;
		};
	}
}

export const commands = {};

export function addCommand(category : string, command : Command): void {
	foxConsole.debug('+ '+command.name);
	if (!module.exports.commands[category]) {
		module.exports.commands[category] = [];
	}

	module.exports.commands[category][command.name] = command;
}

export function setClient(clientSet : Discord.Client) {
	client = clientSet;
}

export function setPrefix(prefixSet : string) {
	prefix = prefixSet;
}

addCommand('core', new SimpleCommand('help', (message : Discord.Message) => {
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
				.addField('Usage', prefix+command.name+' '+command.displayUsage)
				.setDescription(command.description)
				.setColor(Math.floor(Math.random() * 16777215));

			let commandExamplesPatched = command.examples.map(v => prefix+command.name+' '+v);

			if (command.examples.length !== 0) { embed = embed.addField('Examples', '`' + commandExamplesPatched.join('`,\n`') + '`'); }
			if (command.aliases.length !== 0) { embed = embed.addField('Aliases', '`' + command.aliases.join('`, `') + '`'); }

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
				const embed: Discord.RichEmbed = new Discord.RichEmbed()
					.setTitle(`**${grammar(categoryName)}** [${Object.keys(category).length}]`)
					.setColor(Math.floor(Math.random() * 16777215));

				const commands: string[] = [];

				Object.values(category).forEach((cmd) => {
					if (!cmd.hidden) { commands.push('`' + cmd.name + '` - ' + cmd.description.split('\n')[0]); }
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
		if (m instanceof Discord.Message)
			m.edit(`Message latency: ${Date.now() - dateStart}ms\nWebsocket ping: ${Math.round(bot.ping)}ms`);
	});
})
	.setDescription('ping the bot'));