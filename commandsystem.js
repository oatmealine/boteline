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

		this.hidden = false;
		this.owneronly = false;
		this.description = 'No description provided';

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
		if (this.examples) {
			this.examples.push(examplestring);
		} else {
			this.examples = [examplestring];
		}
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

	runCommand(message, client) {
		return this.function(message, client);
	}
}

class SimpleCommand extends Command {
	runCommand(message, client) {
		let returned = this.function(message, client);
    
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
          
					if (category[params[1]]) {
						command = category[params[1]];
					}
				});

				if (command) {
					return new Discord.RichEmbed()
						.setTitle(`**${grammar(command.name)}** (${grammar(categoryname)})`)
						.addField('Usage', command.usage)
						.addField('Examples', command.examples ? '`'+command.examples.join('`.\n`')+'`' : 'No examples...')
						.setDescription(command.description)
						.setColor(Math.floor(Math.random()*16777215));
				} else {
					return `Command \`${params[1]}\` not found!`;
				}
			} else {
				let endstring = '';

				Object.values(module.exports.commands).forEach((category, i) => {
					let categoryname = Object.keys(module.exports.commands)[i];
					endstring += `\n> **${grammar(categoryname)}**`;

					Object.values(category).forEach(cmd => {
						if (!cmd.hidden) endstring += `\n${cmd.usage} - ${cmd.description === undefined ? 'no description' : cmd.description}`;
					});
				});
        
				return endstring;
			}
		})
			.setUsage('help [string]')
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