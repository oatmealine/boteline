/* eslint-disable no-case-declarations */

// libraries & modules
const Discord = require('discord.js');
const bot = new Discord.Client();

require('colors');
const foxconsole = require('./foxconsole.js');

const { exec } = require('child_process');
const fs = require('fs');

// files
if (!fs.existsSync('./foxquotes.json')) {
	fs.writeFileSync('./foxquotes.json', '[]');
}
let foxquotes = require('./foxquotes.json');

if (!fs.existsSync('./userdata.json')) {
	fs.writeFileSync('./userdata.json', '{}');
}
let userdata = require('./userdata.json');

let foxquotessaveneeded = false;

// .env stuff
require('dotenv').config();
foxconsole.showDebug(process.env.DEBUG);

// constants & variables
const prefix = process.env.PREFIX;
const version = require('./package.json').version + ' alpha';

const valhalladrinks = require('./valhalla.json');

let application;

// functions
function makeDrinkEmbed(drink) {
	let embed = new Discord.RichEmbed({
		title: drink.name,
		fields: [
			{
				name: 'Description',
				value: '"' + drink.blurb + '"'
			},
			{
				name: 'Flavor',
				value: drink.flavour,
				inline: true
			},
			{
				name: 'Type',
				value: drink.type.join(', '),
				inline: true
			},
			{
				name: 'Price',
				value: '$' + drink.price,
				inline: true
			},
			{
				name: 'Preparation',
				value: `A **${drink.name}** is **${drink.ingredients.adelhyde}** Adelhyde, **${drink.ingredients.bronson_extract}** Bronson Extract, **${drink.ingredients.powdered_delta}** Powdered Delta, **${drink.ingredients.flangerine}** Flangerine ${drink.ingredients.karmotrine === 'optional' ? 'with *(optional)*' : `and **${drink.ingredients.karmotrine}**`} Karmotrine. All ${drink.aged ? `aged${drink.iced ? ', ' : ' and '}` : ''}${drink.iced ? 'on the rocks and ' : ''}${drink.blended ? 'blended' : 'mixed'}.`
			}
		],
		footer: { text: 'CALICOMP 1.1' },
		color: [255, 0, 255]
	});
	embed.setColor([255, 0, 255]);
	return embed;
}

String.prototype.hashCode = function () {
	var hash = 0, i, chr;
	if (this.length === 0) return hash;
	for (i = 0; i < this.length; i++) {
		chr = this.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};

function normalDistribution(x) {
	return Math.pow(Math.E, (-Math.PI * x * x));
}

function seedAndRate(str) {
	const exclusions = {'boteline': 0, 'mankind': 0, 'fox': 10, 'thefox': 10};
	
	if (Object.keys(str).includes('str')) {
		return exclusions[str];
	} else {
		let hashCode = Math.abs(str.hashCode());
		return Math.round(normalDistribution(hashCode%0.85)*10);
	}
}

console.log(`boteline v${version}`.bold.red);
if (process.env.DEBUG) console.debug('debug printing on'.grey);

// i KNOW this is messy but like ,,, how else would you do this
console.log(`

  ${'              '.bgRed}
${'                  '.bgRed}
${'        '.bgRed}${'        '.bgYellow}${'  '.bgRed}
${'      '.bgRed}${'  ██    ██'.white.bgYellow}${'  '.bgRed}
  ${'    '.bgRed}${'          '.bgYellow}
    ${'  '.bgRed}${'        '.bgGreen}
      ${'  '.bgWhite}    ${'  '.bgWhite}

`.bold);

foxconsole.info('starting...');

bot.on('message', msg => {
	let content = msg.content;
	let author = msg.author;

	if (author.id === process.env.OWNER && !content.startsWith(prefix)) {
		foxquotes.push({ createdTimestamp: msg.createdTimestamp, content: msg.content, author: { username: author.username, avatarURL: author.avatarURL } });
		foxquotessaveneeded = true;
	}

	if (userdata[author.id] === undefined) {
		userdata[author.id] = {
			nwordpasses: 1,
			nwordpassxp: 0,
			nwordpassxpneeded: 100,
			nextpass: 0,
			nworddisable: true
		};
	}
	if (!userdata[author.id].nworddisable && !content.startsWith(prefix)) {
		// patch for old accounts
		if (!userdata[author.id].nwordpassxpneeded) {
			userdata[author.id].nwordpassxpneeded = 100 + userdata[author.id].nwordpasses*50;
		}

		let count = (msg.content.toLowerCase().replace(' ', '').match(/nigg/g) || []).length;

		if (count === 0 && Date.now() > userdata[author.id].nextpass) {
			userdata[author.id].nwordpassxp += Math.floor(Math.random() * 10 + 5);
			userdata[author.id].nextpass = Date.now() + 120000;

			if (userdata[author.id].nwordpassxp > userdata[author.id].nwordpassxpneeded) {
				userdata[author.id].nwordpassxp -= 100;
				userdata[author.id].nwordpasses += 1;
				userdata[author.id].nwordpassxpneeded = 100 + userdata[author.id].nwordpasses*50;
				msg.channel.send(`**${author.username}#${author.discriminator}** recieved an N-Word pass!`);
			}
		} else {
			if (count > userdata[author.id].nwordpasses) {
				if (msg.deletable) { msg.delete(); }
				msg.reply('you don\'t have enough N-Word passes!');
			} else if (count !== 0) {
				userdata[author.id].nwordpasses -= count;
				msg.channel.send(`:bangbang: ${msg.author.toString()} used ${count} N-Word ${count === 1 ? 'pass' : 'passes'}`);
				userdata[author.id].nwordpassxpneeded = 100 + userdata[author.id].nwordpasses*50;
			}
		}
	}

	if (content.startsWith(prefix)) {
		content = content.slice(prefix.length, content.length);
		let cmd = content.split(' ')[0];
		let params = content.split(' ').slice(1, content.length);

		foxconsole.debug('got command ' + cmd);

		// core
		switch (cmd) {
		case 'help':
			author.send(`
x | y - use in either x or y
[] - unnecessary parameter
() - necessary parameter

**Core**:
- help - recieve some help
- ping - ping the bot
- invite - get an invite to the bot

**Moderating**:
- ban - ban a user
- kick - kick a user
			
**Utilities**:
- fahrenheit (celsius temp) - convert celsius temp to fahrenheit
- celsius (fahrenheit temp) - convert fahrenheit temp to celsius
- kelvin (celsius temp) - convert celsius to kelvin
- mbs (mbps speed) - convert mbps speed to mb/s
- mbps (mb/s speed) - convert mb/s speed to mbps
- liters (gallons) - convert gallons to liters
- gallons (liters) - convert liters to gallons
- kg (pounds) - convert pounds to kilograms
- pounds (kilograms) - convert kilograms to pounds
- ounce (pounds) - convert pounds to ounces

- pfp [id] - get the profile picture of a user
- servericon - get the icon of a server

**Fun**:
- valhalla ((search) (drink name) | (make) (ingredients marked by their first letter) [mixed?] [on the rocks?] [aged?]) - search a va-11 hall-a drinks by either recipe or name/flavour/type
- foxquote - get a random quote of fox
- achievement [stuff to put] - make a minecraft achievement popup
- nwordpass [toggle] - enable/disable the n word pass system and check how many you have
- eat - eat
- rate (thing) - rate a thing
- ask (yes/no question) - ask a question
- pick (option 1) (option 2) - ask to pick an option
			`);
			if (msg.channel.type === 'text') {
				msg.channel.send(':mailbox_with_mail: check your DMs!');
			}
			break;
		case 'invite':
			msg.channel.send(`Invite me here: <https://discordapp.com/oauth2/authorize?client_id=${application.id}&scope=bot&permissions=314432>`);
			break;

		case 'ping':
			let datestart = Date.now();
			msg.channel.send('hol up').then(m => {
				m.edit(`Message latency: ${Date.now() - datestart}ms
Websocket ping: ${bot.ping}ms`);
			});
			break;
		}

		// moderating
		switch (cmd) {
		case 'ban':
			if (params.length !== 1) { msg.reply('command doesn\'t match syntax: `ban (id)`'); break; }
			if (msg.channel.type !== 'text') { msg.reply('you\'re in a DM!'); break; }
			if (msg.member.hasPermission('BAN_MEMBERS')) {
				if (msg.guild.me.hasPermission('BAN_MEMBERS')) {
					if (isNaN(params[0]))
						msg.reply('ID isn\'t resolvable!');
					else {
						if (msg.guild.members.get(params[0]) !== undefined) {
							let banmember = msg.guild.members.get(params[0]);

							if (banmember.id === msg.member.id) {
								return msg.reply('hedgeberg#7337 is now b&. :thumbsup:'); // https://hedgeproofing.tech
							}

							if (banmember.bannable) {
								banmember.ban();
								msg.channel.send('✓ Banned ' + banmember.username);
							} else
								msg.reply('member ' + banmember.username + ' isn\'t bannable');
						} else
							msg.reply('i don\'t know that person!');
					}
				} else
					msg.reply('i don\'t have ban permissions!');
			} else
				msg.reply('you don\'t have ban permissions!');
			break;
		case 'kick':
			if (params.length !== 1) { msg.reply('command doesn\'t match syntax: `kick (id)`'); break; }
			if (msg.channel.type !== 'text') { msg.reply('you\'re in a DM!'); break; }
			if (msg.member.hasPermission('KICK_MEMBERS')) {
				if (msg.guild.me.hasPermission('KICK_MEMBERS')) {
					if (isNaN(params[0]))
						msg.reply('ID isn\'t resolvable!');
					else {
						if (msg.guild.members.get(params[0]) !== undefined) {
							let kickmember = msg.guild.members.get(params[0]);

							if (kickmember.id === msg.member.id) {
								return msg.reply('hedgeberg#7337 is now b&. :thumbsup:'); // https://hedgeproofing.tech
							}

							if (kickmember.kickable) {
								kickmember.kick();
								msg.channel.send('✓ Kicked ' + kickmember.username);
							} else
								msg.reply('member ' + kickmember.username + ' isn\'t kickable');
						} else
							msg.reply('i don\'t know that person!');
					}
				} else
					msg.reply('i don\'t have kick permissions!');
			} else
				msg.reply('you don\'t have kick permissions!');
			break;
		}

		// utilities
		switch (cmd) {
		case 'fahrenheit':
			if (params.length !== 1) {
				msg.reply('command doesn\'t match syntax: `fahrenheit (celcius temp)`');
				break;
			}
			if (isNaN(parseFloat(params[0]))) {
				msg.reply('number is unresolvable!');
				break;
			}

			msg.channel.send(`${params[0]}°C is **${Math.round(((Number(params[0]) * 9 / 5) + 32) * 100) / 100}°F**`);
			break;
		case 'celsius':
			if (params.length !== 1) {
				msg.reply('command doesn\'t match syntax: `celsius (fahrenheit temp)`');
				break;
			}
			if (isNaN(parseFloat(params[0]))) {
				msg.reply('number is unresolvable!');
				break;
			}

			msg.channel.send(`${params[0]}°F is **${Math.round(((Number(params[0]) - 32) * 5 / 9) * 100) / 100}°C**`);
			break;
		case 'kelvin':
			if (params.length !== 1) {
				msg.reply('command doesn\'t match syntax: `kelvin (celsius temp)`');
				break;
			}
			if (isNaN(parseFloat(params[0]))) {
				msg.reply('number is unresolvable!');
				break;
			}

			msg.channel.send(`${params[0]}°C is ${params[0] < -273.15 ? `**physically impossible** ~~(buut would be **${Math.round((Number(params[0]) + 273.15) * 100) / 100}K**)~~` : `**${Math.round((Number(params[0]) + 273.15) * 100) / 100}K**`}`);
			break;

		case 'mbs':
			if (params.length !== 1) {
				msg.reply('command doesn\'t match syntax: `mbs (mbps speed)`');
				break;
			}
			if (isNaN(parseFloat(params[0]))) {
				msg.reply('number is unresolvable!');
				break;
			}

			msg.channel.send(`${params[0]}Mbps is **${Math.round((Number(params[0])) / 8 * 100) / 100}MB/s**`);
			break;
		case 'mbps':
			if (params.length !== 1) {
				msg.reply('command doesn\'t match syntax: `mbps (mbs speed)`');
				break;
			}
			if (isNaN(parseFloat(params[0]))) {
				msg.reply('number is unresolvable!');
				break;
			}

			msg.channel.send(`${params[0]}MB/s is **${Math.round((Number(params[0])) * 800) / 100}Mbps**`);
			break;

		case 'liters':
			if (params.length !== 1) {
				msg.reply('command doesn\'t match syntax: `liters (gallons)`');
				break;
			}
			if (isNaN(parseFloat(params[0]))) {
				msg.reply('number is unresolvable!');
				break;
			}

			msg.channel.send(`${params[0]} imperial gallons is **${Math.round((Number(params[0])) * 4.546 * 100) / 100}L**`);
			break;
		case 'gallons':
			if (params.length !== 1) {
				msg.reply('command doesn\'t match syntax: `gallons (liters)`');
				break;
			}
			if (isNaN(parseFloat(params[0]))) {
				msg.reply('number is unresolvable!');
				break;
			}

			msg.channel.send(`${params[0]}L is **${Math.round((Number(params[0])) / 4.546 * 100) / 100} imperial gallons**`);
			break;

		case 'kg':
			if (params.length !== 1) {
				msg.reply('command doesn\'t match syntax: `kg (pounds)`');
				break;
			}
			if (isNaN(parseFloat(params[0]))) {
				msg.reply('number is unresolvable!');
				break;
			}

			msg.channel.send(`${params[0]} pounds is **${Math.round((Number(params[0])) / 2.205 * 100) / 100}KG**`);
			break;
		case 'pound':
		case 'pounds':
			if (params.length !== 1) {
				msg.reply('command doesn\'t match syntax: `pound (kilograms)`');
				break;
			}
			if (isNaN(parseFloat(params[0]))) {
				msg.reply('number is unresolvable!');
				break;
			}

			msg.channel.send(`${params[0]}KG is **${Math.round((Number(params[0])) * 2.205 * 100) / 100} pounds**`);
			break;
		case 'ounce':
		case 'ounces':
			if (params.length !== 1) {
				msg.reply('command doesn\'t match syntax: `ounce (pound)`');
				break;
			}
			if (isNaN(parseFloat(params[0]))) {
				msg.reply('number is unresolvable!');
				break;
			}

			msg.channel.send(`${params[0]} pounds is **${Math.round((Number(params[0])) * 16 * 100) / 100} ounces**`);
			break;

		case 'servericon':
		case 'icon':
			if (msg.channel.type !== 'text') { msg.reply('you\'re in a DM!'); break; }
			msg.channel.send('', { files: [{ attachment: msg.guild.iconURL, name: 'icon.png' }] });
			break;

		case 'pfp':
		case 'avatar':
			let user;
			if (params[0] !== undefined) {
				user = bot.users.get(params[0]);
				if (user === undefined) {
					msg.reply('not a valid ID!');
					break;
				}
			} else {
				user = msg.author;
			}
			msg.channel.send('', { files: [{ attachment: msg.author.avatarURL, name: 'avatar.png' }] });
			break;
		}

		// fun
		switch (cmd) {
		case 'rate':
			if (!params[0]) {
				msg.channel.send('command doesn\'t match syntax: `rate (string)`');
			} else {
				let thingToRate = params.join(' ');
				let rating = seedAndRate(thingToRate.toLowerCase().split(' ').join(''));
				msg.channel.send(`I'd rate ${thingToRate} a **${rating}/10**`);
			}
			break;
		case 'pick':
			if (!params[0]) {
				msg.channel.send('command doesn\'t match syntax: `pick (option 1) (option 2)`');
			} else {
				let thingToRate1 = params[0];
				let thingToRate2 = params[1];
				let rating1 = seedAndRate(thingToRate1.toLowerCase().split(' ').join(''));
				let rating2 = seedAndRate(thingToRate2.toLowerCase().split(' ').join(''));
				msg.channel.send(`Out of ${thingToRate1} and ${thingToRate2}, I'd pick **${rating1 > rating2 ? thingToRate1 : thingToRate2}**`);
			}
			break;
		case 'ask':
			if (!params[0]) {
				msg.channel.send('command doesn\'t match syntax: `ask (yes/no question)`');
			} else {
				let thingToRate = params.join(' ');
				msg.channel.send(`> ${thingToRate}\nI'd say, **${['yes','probably','maybe','no'][Math.abs(thingToRate.hashCode())*23%4]}**`);
			}
			break;
		case 'eat':
			const eat = bot.emojis.get('612360473928663040').toString();
			const hamger1 = bot.emojis.get('612360474293567500').toString();
			const hamger2 = bot.emojis.get('612360473987252278').toString();
			const hamger3 = bot.emojis.get('612360473974931458').toString();

			msg.channel.send(eat + hamger1 + hamger2 + hamger3).then(m => {
				setTimeout(() => {
					m.edit(eat + hamger2 + hamger3).then(m => {
						setTimeout(() => {
							m.edit(eat + hamger3).then(m => {
								setTimeout(() => {
									m.edit(eat).then(m => {
										setTimeout(() => {
											m.delete();
										}, 2000);
									});
								}, 1000);
							});
						}, 1000);
					});
				}, 1000);
			});
			break;
		case 'nwordpass':
			if (params[0] === 'toggle') {
				userdata[author.id].nworddisable = !userdata[author.id].nworddisable;
				msg.reply(`the system is now **${userdata[author.id].nworddisable ? 'OFF' : 'ON'}**`);
			} else {
				msg.channel.send(`You have:
**${userdata[author.id].nwordpasses}** N-Word passes [**${userdata[author.id].nworddisable ? 'OFF' : 'ON'}**] (Use m=nwordpass toggle to disable/enable)
You are: **\`[${'█'.repeat(Math.floor((userdata[author.id].nwordpassxp / userdata[author.id].nwordpassxpneeded)*10))}${'_'.repeat(10 - (userdata[author.id].nwordpassxp / userdata[author.id].nwordpassxpneeded)*10)}]\`** this close to getting another N-Word pass`);
			}
			break;
		case 'valhalla':
			if (params.length < 2) {
				msg.reply('command doesn\'t match syntax: `valhalla ((search) (drink name) | (make) (ingredients marked by their first letter) [blended] [ice] [aged])`');
				break;
			}

			if (params[0] === 'search') {
				let founddrinks = [];
				let search = params.slice(1, params.length).join(' ');

				valhalladrinks.forEach(d => {
					if (d.name.toLowerCase().includes(search.toLowerCase()) || d.flavour.toLowerCase() === search.toLowerCase()) {
						founddrinks.push(d);
					} else {
						d.type.forEach(f => {
							if (search.toLowerCase() === f.toLowerCase()) {
								founddrinks.push(d);
							}
						});
					}
				});
				if (founddrinks.length < 1) {
					msg.channel.send(`Found no matches for \`${params[1]}\``);
				} else if (founddrinks.length === 1) {
					msg.channel.send('', makeDrinkEmbed(founddrinks[0]));
				} else {
					let founddrinksstr = '\n';
					founddrinks.slice(0, 5).forEach(d => {
						founddrinksstr = founddrinksstr + '**' + d.name + '**\n';
					});
					if (founddrinks.length > 5) {
						founddrinksstr = founddrinksstr + `..and ${founddrinks.length - 5} more drinks`;
					}

					msg.channel.send(`Found ${founddrinks.length} drinks:\n${founddrinksstr}`);
				}
			} else if (params[0] === 'make') {
				let adelhyde = 0;
				let bronson_extract = 0;
				let powdered_delta = 0;
				let flangerine = 0;
				let karmotrine = 0;

				let blended = false;
				let aged = false;
				let iced = false;

				params[1].split('').forEach(i => {
					switch (i) {
					case 'a':
						adelhyde += 1;
						break;
					case 'b':
						bronson_extract += 1;
						break;
					case 'p':
						powdered_delta += 1;
						break;
					case 'f':
						flangerine += 1;
						break;
					case 'k':
						karmotrine += 1;
					}
				});

				blended = params.includes('blended');
				iced = params.includes('ice');
				aged = params.includes('aged');

				foxconsole.debug(`${adelhyde}, ${bronson_extract}, ${powdered_delta}, ${flangerine}, ${karmotrine}`);
				foxconsole.debug(`${blended}, ${aged}, ${iced}`);

				let drink;
				let drinkbig;
				valhalladrinks.forEach(d => {
					if (adelhyde + bronson_extract + powdered_delta + flangerine + karmotrine > 20) return;

					drinkbig = adelhyde / 2 === d.ingredients.adelhyde
							&& bronson_extract / 2 === d.ingredients.bronson_extract
							&& powdered_delta / 2 === d.ingredients.powdered_delta
							&& flangerine / 2 === d.ingredients.flangerine
							&& (karmotrine / 2 === d.ingredients.karmotrine || d.ingredients.karmotrine === 'optional');

					if (adelhyde !== d.ingredients.adelhyde && (adelhyde / 2 !== d.ingredients.adelhyde || !drinkbig)) return;
					if (bronson_extract !== d.ingredients.bronson_extract && (bronson_extract / 2 !== d.ingredients.bronson_extract || !drinkbig)) return;
					if (powdered_delta !== d.ingredients.powdered_delta && (powdered_delta / 2 !== d.ingredients.powdered_delta || !drinkbig)) return;
					if (flangerine !== d.ingredients.flangerine && (flangerine / 2 !== d.ingredients.flangerine || !drinkbig)) return;
					if ((karmotrine !== d.ingredients.karmotrine && (karmotrine / 2 !== d.ingredients.karmotrine || !drinkbig)) && d.ingredients.karmotrine !== 'optional') return;

					if (blended !== d.blended) return;
					if (aged !== d.aged) return;
					if (iced !== d.iced) return;

					drink = d;
				});

				msg.channel.send(':timer: **Making drink...**').then((editmsg) => {
					setTimeout(() => {
						if (drink === undefined) {
							editmsg.edit('Failed to make drink!');
						} else {
							editmsg.edit('Successfully made drink!' + (drinkbig ? ' (its big too, woah)' : ''), makeDrinkEmbed(drink));
						}
					}, blended ? 7000 : 3000);
				});
			}

			break;
		case 'foxquote':
			let randommsg = Object.values(foxquotes)[Math.floor(Math.random() * foxquotes.length)];
			if (randommsg === undefined) { break; }

			msg.channel.send('', new Discord.RichEmbed({
				author: { name: randommsg.author.username, icon: randommsg.author.avatarURL },
				timestamp: randommsg.createdTimestamp,
				description: randommsg.content
			}));
			break;
		case 'achievement':
			if (params.length < 1) {
				msg.reply('command doesn\'t match syntax: `achievement (text)`');
				break;
			}

			msg.channel.send('', { files: [{ attachment: 'https://minecraftskinstealer.com/achievement/1/Achievement+Get%21/' + params.join('+'), name: 'achievement.png' }] });
			break;
		}

		// debug and owneronly commands
		if (author.id === process.env.OWNER) {
			switch (cmd) {
			case 'debug':
				let clean = function (text) {
					if (typeof (text) === 'string') {
						text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
						return text;
					} else
						return text;
				};

				try {
					var code = content.replace(cmd + ' ', '');
					var evaled = eval(code);

					if (typeof evaled !== 'string')
						evaled = require('util').inspect(evaled);

					let embed = {
						title: 'Eval',
						color: '990000',
						fields: [{
							name: 'Input',
							value: '```xl\n' + code + '\n```',
							inline: true
						},
						{
							name: 'Output',
							value: '```xl\n' + clean(evaled) + '\n```',
							inline: true
						}
						]
					};

					msg.channel.send('', { embed });
					msg.react('☑');
				} catch (err) {
					msg.channel.send(`:warning: \`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
				}
				break;
			case 'exec':
				exec(content.replace(cmd + ' ', ''), (err, stdout) => {
					if (err) {
						msg.channel.send('```' + err + '```');
					} else {
						msg.channel.send('```' + stdout + '```');
					}
				});
			}
		}
	}
});

bot.on('ready', () => {
	foxconsole.info('fetching application...');
	bot.fetchApplication().then(app => {
		application = app;
	});

	foxconsole.info('doing post-login intervals...');

	let presences = [['Celeste', 'PLAYING'], ['Celeste OST', 'LISTENING'], ['you', 'WATCHING'], ['sleep', 'PLAYING'], [`try ${process.env.PREFIX}help`, 'PLAYING'], [`Boteline v${version}`]];

	setInterval(() => {
		presences.push([`${bot.guilds.size} servers`, 'WATCHING']);
		presences.push([`with ${bot.users.size} users`, 'PLAYING']);

		let presence = presences[Math.floor(Math.random() * presences.length)];
		bot.user.setPresence({ status: 'dnd', game: { name: presence[0], type: presence[1] } });

		foxconsole.debug(`changed presence to [${presence}]`);
	}, 30000);

	setInterval(() => {
		foxconsole.debug('saving userdata...');
		fs.writeFile('./userdata.json', JSON.stringify(userdata), (err) => {
			if (err) {
				foxconsole.error('failed saving userdata: ' + err);
			} else {
				foxconsole.success('saved userdata');
			}
		});

		if (!foxquotessaveneeded) return;
		foxconsole.debug('saving foxquotes...');
		fs.writeFile('./foxquotes.json', JSON.stringify(foxquotes), (err) => {
			if (err) {
				foxconsole.error('failed saving foxquotes: ' + err);
			} else {
				foxconsole.success('saved foxquotes');
				foxquotessaveneeded = false;
			}
		});
	}, 120000);

	foxconsole.success('ready!');
});

foxconsole.info('logging in...');
bot.login(process.env.TOKEN);

foxconsole.info('patching out token...');
process.env.TOKEN = '[TOKEN]';
