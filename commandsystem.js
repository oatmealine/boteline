const Discord = require('discord.js');
const foxconsole = require('./foxconsole.js');

function grammar(string) {
	let newstring = string.slice(1,string.length);
	return string[0].toUpperCase()+newstring;
}

class Command {
	constructor(name, cfunction) {
		this.name = name;
		this.function = cfunction;
		this.usage = name;
		this.clientPermissions = [];
		this.userPermissions = [];

		this.needsDM = false;
		this.needsGuild = false;

		this.hidden = false;
		this.owneronly = false;
		this.description = 'No description provided';

		this.aliases = [];
		this.examples = [];

		return this;
	}

	setName(name) {
		this.name = name;
		return this;
	}

	setUsage(usgstring) {
		this.usage = usgstring;
		return this;
	}

	addExample(examplestring) {
		this.examples.push(examplestring);
		return this;
	}

	addAlias(aliasstring) {
		this.aliases.push(aliasstring);
		return this;
	}

	addAliases(aliasarr) {
		aliasarr.forEach(alias => {
			this.addAlias(alias);
		});
		return this;
	}

	setDescription(desc) {
		this.description = desc === undefined ? 'No description provided' : desc;
		return this;
	}
  
	setHidden(hide) {
		this.hidden = hide === undefined ? true : hide;
		return this;
	}
  
	setOwnerOnly(owner) {
		this.owneronly = owner === undefined ? true : owner;
		return this;
	}

	setDMOnly(needs) {
		this.needsDM = needs === undefined ? true : needs;
		return this;
	}

	setGuildOnly(needs) {
		this.needsGuild = needs === undefined ? true : needs;
		return this;
	}

	addClientPermission(string) {
		if (Object.keys(Discord.Permissions.FLAGS).includes(string)) {
			this.clientPermissions.push(string);
		} else {
			foxconsole.warning('unknown permission '+string);
		}
		return this;
	}

	addUserPermission(string) {
		if (Object.keys(Discord.Permissions.FLAGS).includes(string)) {
			this.userPermissions.push(string);
		} else {
			foxconsole.warning('unknown permission '+string);
		}
		return this;
	}

	addClientPermissions(stringarr) {
		stringarr.forEach(string => {
			this.addClientPermission(string);
		});
		
		return this;
	}

	addUserPermissions(stringarr) {
		stringarr.forEach(string => {
			this.addUserPermission(string);
		});
		
		return this;
	}

	runCommand(message, client) {
		if (this.needsGuild && !message.guild) {
			return message.channel.send('This command needs to be ran in a server!');
		}

		if (this.needsDM && message.guild) {
			return message.channel.send('This command needs to be ran in a DM!');
		}

		if (this.userPermissions.length > 0 && message.guild) {
			let missingpermissions = [];

			this.userPermissions.forEach(perm => {
				if (!message.member.hasPermission(perm)) {
					missingpermissions.push(perm);
				}
			});

			if (missingpermissions.length > 0) {
				return message.channel.send(`**You can't run this command!** You need these permissions to use this command: \`${missingpermissions.join(', ')}\``);
			}
		}

		if (this.clientPermissions.length > 0 && message.guild) {
			let missingpermissions = [];

			this.clientPermissions.forEach(perm => {
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

class SimpleCommand extends Command {
	constructor(name, cfunction) {
		super(name, cfunction);

		this.function = (message, client) => {
			let returned = cfunction(message, client);

			if (!returned) {
				foxconsole.warning('SimpleCommand returned nothing, please use Command class instead');
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

let commands = {
	core: {
		help: new SimpleCommand('help', message => {
			let params = message.content.split(' ');

			if (params[1]) {
				let command;
				let categoryname;

				Object.values(module.exports.commands).forEach((category, i) => {
					if (command) return;

					categoryname = Object.keys(module.exports.commands)[i];
          
					Object.values(category).forEach(cmd => {
						if (cmd.name === params[1] || cmd.aliases.includes(params[1])) {
							command = cmd;
						}
					});
				});

				if (command) {
					let embed = new Discord.RichEmbed()
						.setTitle(`**${grammar(command.name)}** (${grammar(categoryname)})`)
						.addField('Usage', command.usage)
						.setDescription(command.description)
						.setColor(Math.floor(Math.random()*16777215));

					if (command.examples.length !== 0) embed = embed.addField('Examples', '`'+command.examples.join('`,\n`')+'`');
					if (command.aliases.length !== 0) embed = embed.addField('Aliases', command.aliases.join(', '));

					return embed;
				} else {
					let category;
					let categoryname;
					
					Object.values(module.exports.commands).forEach((cat, i) => {
						if (category) return;
	
						categoryname = Object.keys(module.exports.commands)[i];
						if (categoryname === params[1].toLowerCase()) category = cat;
					});

					if (category) {
						let embed = new Discord.RichEmbed()
							.setTitle(`**${grammar(categoryname)}** [${Object.keys(category).length}]`)
							.setColor(Math.floor(Math.random()*16777215));

						let commands = [];

						Object.values(category).forEach(cmd => {
							if (!cmd.hidden) commands.push('`' + cmd.name + '` - ' + cmd.description);
						});

						if (commands.length !== 0) embed.addField('Commands', commands.join('\n'));

						return embed;
					} else
						return `Command or category \`${params[1]}\` not found!`;
				}
			} else {
				let embed = new Discord.RichEmbed()
					.setTitle('**All Boteline Commands**')
					.setColor(Math.floor(Math.random()*16777215))
					.setFooter('Do help (category) to get all commands for a category!');

				Object.values(module.exports.commands).forEach((category, i) => {
					let categoryname = Object.keys(module.exports.commands)[i];
					let commands = [];

					Object.values(category).forEach(cmd => {
						if (!cmd.hidden) commands.push(cmd.name);
					});

					if (commands.length !== 0) embed.addField(`${grammar(categoryname)} [${commands.length}]`, '`'+commands.join('`, `')+'`');
				});
        
				return embed;
			}
		})
			.setUsage('help [string]')
			.addAlias('cmds')
			.setDescription('see commands, or check out a comnmand in detail'),

		ping: new Command('ping', (message, bot) => {
			let datestart = Date.now();
			message.channel.send('hol up').then(m => {
				m.edit(`Message latency: ${Date.now() - datestart}ms\nWebsocket ping: ${bot.ping}ms`);
			});
		})
			.setUsage('ping')
			.setDescription('ping the bot')
	}
};

function addCommand(category, command) {
	if (!module.exports.commands[category]) {
		module.exports.commands[category] = [];
	}

	module.exports.commands[category][command.name] = command;
}

module.exports = {
	SimpleCommand: SimpleCommand,
	Command: Command,
	commands: commands,
	addCommand: addCommand
};