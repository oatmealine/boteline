if (process.cwd().endsWith('built')) {
	process.chdir('../');
	console.log('changed dir to '+process.cwd())
}

// libraries & modules
import * as Discord from 'discord.js';
const bot = new Discord.Client();

import * as cs from './commandsystem.js';

import * as foxconsole from './foxconsole.js';

import {exec} from 'child_process';
import * as fs from 'fs';

import * as os from 'os';

import * as rq from 'request';

import * as ffmpeg from 'fluent-ffmpeg';
const ch = require('chalk');
// files

const packagejson = JSON.parse(fs.readFileSync('./package.json', {encoding: 'utf8'}));
const packagelock = JSON.parse(fs.readFileSync('./package-lock.json', {encoding: 'utf8'}));

if (!fs.existsSync('./foxquotes.json')) {
	fs.writeFileSync('./foxquotes.json', '[]');
}
const foxquotes = JSON.parse(fs.readFileSync('./foxquotes.json', {encoding: 'utf8'}));

if (!fs.existsSync('./userdata.json')) {
	fs.writeFileSync('./userdata.json', '{}');
}
const userdata = JSON.parse(fs.readFileSync('./userdata.json', {encoding: 'utf8'}));

if (!fs.existsSync('./guildsettings.json')) {
	fs.writeFileSync('./guildsettings.json', '{}');
}
const guildsettings = JSON.parse(fs.readFileSync('./guildsettings.json', {encoding: 'utf8'}));

const valhalladrinks = JSON.parse(fs.readFileSync('./valhalla.json', {encoding: 'utf8'}));

let foxquotessaveneeded : boolean = false;

// .env stuff
require('dotenv').config();
foxconsole.showDebug(process.env.DEBUG == 'true');

// constants & variables
const prefix : string = process.env.PREFIX;

const version : string = packagejson.version + ' alpha';

let application: Discord.OAuth2Application;

const cache = {
	'splatoon': {
		timer: new Date(0),
		data: {}
	},
	'salmon': {
		timer: new Date(0),
		data: {}
	}
};

// statistics

let cpuusagemin: number = 0;
let cpuusage30sec: number = 0;
let cpuusage1sec: number = 0;

let cpuusageminold = process.cpuUsage();
let cpuusage30secold = process.cpuUsage();
let cpuusage1secold = process.cpuUsage();

setInterval(() => {
	const usage = process.cpuUsage(cpuusage1secold);
	cpuusage1sec = 100 * (usage.user + usage.system) / 1000000;
	cpuusage1secold = process.cpuUsage();
}, 1000);
setInterval(() => {
	const usage = process.cpuUsage(cpuusage30secold);
	cpuusage30sec = 100 * (usage.user + usage.system) / 30000000;
	cpuusage30secold = process.cpuUsage();
}, 30000);
setInterval(() => {
	const usage = process.cpuUsage(cpuusageminold);
	cpuusagemin = 100 * (usage.user + usage.system) / 60000000;
	cpuusageminold = process.cpuUsage();
}, 60000);

// functions
function makeDrinkEmbed(drink: any) : Discord.RichEmbed {
	const embed = new Discord.RichEmbed({
		title: drink.name,
		fields: [
			{
				name: 'Description',
				value: '"' + drink.blurb + '"',
			},
			{
				name: 'Flavor',
				value: drink.flavour,
				inline: true,
			},
			{
				name: 'Type',
				value: drink.type.join(', '),
				inline: true,
			},
			{
				name: 'Price',
				value: '$' + drink.price,
				inline: true,
			},
			{
				name: 'Preparation',
				value: `A **${drink.name}** is **${drink.ingredients.adelhyde}** Adelhyde, **${drink.ingredients.bronson_extract}** Bronson Extract, **${drink.ingredients.powdered_delta}** Powdered Delta, **${drink.ingredients.flangerine}** Flangerine ${drink.ingredients.karmotrine === 'optional' ? 'with *(optional)*' : `and **${drink.ingredients.karmotrine}**`} Karmotrine. All ${drink.aged ? `aged${drink.iced ? ', ' : ' and '}` : ''}${drink.iced ? 'on the rocks and ' : ''}${drink.blended ? 'blended' : 'mixed'}.`,
			},
		],
		footer: { text: 'CALICOMP 1.1' }
	}).setColor([255, 0, 255]);
	return embed;
}

function hashCode(str: string) : number {
	let hash = 0, i, chr;
	if (str.length === 0) { return hash; }
	for (i = 0; i < str.length; i++) {
		chr = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
}

function getParams(message: Discord.Message) : string[] {
	return message.content.split(' ').slice(1, message.content.length);
}

function roundNumber(num: number, decimals: number) {
	return Math.round(num*Math.pow(10, decimals))/Math.pow(10, decimals)
}

function normalDistribution(x: number) : number {
	return Math.pow(Math.E, (-Math.PI * x * x));
}

function seedAndRate(str: string) : number {
	const exclusions = {boteline: 0, mankind: 0, fox: 10, thefox: 10};

	if (Object.keys(str).includes('str')) {
		return exclusions[str];
	} else {
		const hc = Math.abs(hashCode(str));
		return Math.round(normalDistribution(hc % 0.85) * 10);
	}
}

function checkSplatoon() : Promise<any> {
	return new Promise(resolve => {
		if (cache.splatoon !== undefined) {
			if (cache.splatoon.timer.getHours() >= new Date().getHours() && new Date(cache.splatoon.timer.getTime()+1200000) >= new Date()) {
				resolve(cache.splatoon);
				return;
			}
		}

		foxconsole.debug('fetching splatoon2.ink data...')
		rq('https://splatoon2.ink/data/schedules.json', {
			'user-agent': 'Boteline (oatmealine#1704)'
		}, (err, response, body : string) => {
			foxconsole.debug('got code '+response.statusCode);
			if (response.statusCode === 200 && !err) {
				foxconsole.debug('done!');
				cache.splatoon.data = JSON.parse(body);
				cache.splatoon.timer = new Date();
				resolve(cache.splatoon);
			} else {
				foxconsole.warning('failed to fetch splatoon2.ink data, using potentially outdated data');
				resolve(cache.splatoon);
			}
		});
	});
};

function checkSalmon() : Promise<any> {
	return new Promise(resolve => {
		if (cache.salmon !== undefined) {
			if (cache.salmon.timer.getHours() >= new Date().getHours() && new Date(cache.salmon.timer.getTime()+1200000) >= new Date()) {
				resolve(cache.salmon);
				return;
			}
		}

		foxconsole.debug('fetching splatoon2.ink data...')
		rq('https://splatoon2.ink/data/coop-schedules.json', {
			'user-agent': 'Boteline (oatmealine#1704)'
		}, (err, response, body : string) => {
			foxconsole.debug('got code '+response.statusCode);
			if (response.statusCode === 200 && !err) {
				foxconsole.debug('done!');
				cache.salmon.data = JSON.parse(body);
				cache.salmon.timer = new Date();
				resolve(cache.salmon);
			} else {
				foxconsole.warning('failed to fetch splatoon2.ink data, using potentially outdated data');
				resolve(cache.salmon);
			}
		});
	});
};

function formatTime(date : Date) : string {
	let hours = date.getUTCHours()
	let minutes = date.getUTCMinutes()

	return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes} UTC`
}

class FFMpegCommand extends cs.Command {
	public inputOptions: Function
	public outputOptions: Function

	constructor(name, inputOptions, outputOptions) {
		super(name, null);

		this.inputOptions = inputOptions;
		this.outputOptions = outputOptions;

		this.function = async (msg) => {
			const params = getParams(msg);
			const attachments = [];

			if (msg.attachments.size === 0) {
				await msg.channel.fetchMessages({limit: 20}).then((msges) => {
					msges.array().forEach((m) => {
						if (m.attachments.size > 0) {
							m.attachments.array().forEach((att) => {
								attachments.push(att);
							});
						}
					});
				});
			} else {
				attachments.push(msg.attachments.first());
			}

			if (attachments.length > 0) {
				let videoattach;

				attachments.forEach((attachment) => {
					if (videoattach || !attachment) { return; }

					const filetype = attachment.filename.split('.').pop();
					const acceptedFiletypes = ['apng', 'webm', 'swf', 'wmv', 'mp4', 'flv', 'm4a'];

					if (acceptedFiletypes.includes(filetype.toLowerCase())) {
						videoattach = attachment;
					}
				});

				if (videoattach) {
					let progmessage;
					let lastedit = 0; // to avoid ratelimiting

					msg.channel.send('ok, downloading...').then((m) => {
						progmessage = m;
					});
					msg.channel.startTyping();

					if (params[0]) {
						if (params[0].startsWith('.') || params[0].startsWith('/') || params[0].startsWith('~')) {
							if (progmessage) {
								progmessage.edit('i know exactly what you\'re doing there bud');
							} else {
								msg.channel.send('i know exactly what you\'re doing there bud');
							}
						}
					}

					ffmpeg(videoattach.url)
						.inputOptions(this.inputOptions(msg))
						.outputOptions(this.outputOptions(msg))
						.on('start', (commandLine) => {
							foxconsole.info('started ffmpeg with command: ' + commandLine);
							if (progmessage) {
								progmessage.edit('processing: 0% (0s) done');
							}
						})
						.on('stderr', (stderrLine) => {
							foxconsole.debug('ffmpeg: ' + stderrLine);
						})
						.on('progress', (progress) => {
							if (lastedit + 2000 < Date.now() && progmessage) {
								lastedit = Date.now();
								progmessage.edit(`processing: **${progress.percent !== undefined ? Math.floor(progress.percent * 100) / 100 : '0.00'}%** \`(${progress.timemark})\``);
							}
						})
						.on('error', (err) => {
							msg.channel.stopTyping();
							foxconsole.warning('ffmpeg failed!');
							foxconsole.warning(err);
							if (progmessage) {
								progmessage.edit(`processing: error! \`${err}\``);
							} else {
								msg.channel.send(`An error has occured!: \`${err}\``);
							}
						})
						.on('end', () => {
							msg.channel.stopTyping();
							if (progmessage) {
								progmessage.edit('processing: done! uploading');
							}
							msg.channel.send('ok, done', {files: ['./temp.mp4']}).then(() => {
								if (progmessage) {
									progmessage.delete();
								}
							});
						})
					// .pipe(stream);
						.save('./temp.mp4');
				} else {
					msg.channel.send('No video attachments found');
				}
			} else {
				msg.channel.send('No attachments found');
			}
		};
		return this;
	}
}

console.log(ch.red.bold(`boteline v${version}`));
if (process.env.DEBUG) { console.debug(ch.grey('debug printing on')); }

// i KNOW this is messy but like ,,, how else would you do this
console.log(ch.bold(`

   ${ch.bgRed('              ')}
 ${ch.bgRed('                  ')}
 ${ch.bgRed('        ')}${ch.bgYellow('        ')}${ch.bgRed('  ')}
 ${ch.bgRed('      ')}${ch.white.bgYellow('  ██    ██')}${ch.bgRed('  ')}
   ${ch.bgRed('    ')}${ch.bgYellow('          ')}
     ${ch.bgRed('  ')}${ch.bgGreen('        ')}
       ${ch.bgWhite('  ')}    ${ch.bgWhite('  ')}

`));
foxconsole.info('adding commands...');

cs.addCommand('core', new cs.SimpleCommand('invite', () => {
	return `Invite me here: <https://discordapp.com/oauth2/authorize?client_id=${application.id}&scope=bot&permissions=314432>`;
})
	.setDescription('get the bot\'s invite')
	.addAlias('invitelink')
	.setUsage('invite'));

cs.addCommand('moderating', new cs.SimpleCommand('ban', (message) => {
	const params: string[] = getParams(message);

	if (message.guild.members.get(params[0]) !== undefined) {
		const banmember: Discord.GuildMember = message.guild.members.get(params[0]);

		if (banmember.id === message.member.id) {
			return 'hedgeberg#7337 is now b&. :thumbsup:'; // https://hedgeproofing.tech
		}

		if (banmember.bannable) {
			banmember.ban();
			return '✓ Banned ' + banmember.user.username;
		} else {
			return 'member ' + banmember.user.username + ' isn\'t bannable';
		}
	} else {
		return 'i don\'t know that person!';
	}
})
	.setUsage('ban (id)')
	.setDescription('ban a user')
	.addAlias('banuser')
	.addAlias('banmember')
	.addExample('ban 360111651602825216')
	.addClientPermission('BAN_MEMBERS')
	.addUserPermission('BAN_MEMBERS')
	.setGuildOnly());

cs.addCommand('moderating', new cs.SimpleCommand('kick', (message) => {
	const params: string[] = message.content.split(' ').slice(1, message.content.length);

	if (message.guild.members.get(params[0]) !== undefined) {
		const banmember: Discord.GuildMember = message.guild.members.get(params[0]);

		if (banmember.id === message.member.id) {
			return 'hedgeberg#7337 is now b&. :thumbsup:'; // https://hedgeproofing.tech
		}

		if (banmember.kickable) {
			banmember.ban();
			return '✓ Kicked ' + banmember.user.username;
		} else {
			return 'member ' + banmember.user.username + ' isn\'t kickable';
		}
	} else {
		return 'i don\'t know that person!';
	}
})
	.setUsage('kick (id)')
	.addAlias('kickuser')
	.addAlias('kickmember')
	.setDescription('kick a user')
	.addExample('kick 360111651602825216')
	.addClientPermission('KICK_MEMBERS')
	.addUserPermission('KICK_MEMBERS')
	.setGuildOnly());

cs.addCommand('utilities', new cs.SimpleCommand('fahrenheit', (message) => {
	const params = getParams(message);
	return `${params[0]}°C is **${Math.round(((Number(params[0]) * 9 / 5) + 32) * 100) / 100}°F**`;
})
	.addAliases(['farenheit', 'farenheight', 'fairenheight', 'fairenheit', 'fahrenheight', 'americancelcius', 'stupidunit', 'notcelsius', 'notcelcius', 'weirdformulaunit', 'multiplyby1.8andadd32'])
	.setUsage('fahrenheit (number)')
	.setDescription('convert celsius to fahrenheit')
	.addExample('fahrenheit 15'));

cs.addCommand('utilities', new cs.SimpleCommand('celsius', (message) => {
	const params = getParams(message);
	return `${params[0]}°F is **${Math.round(((Number(params[0]) - 32) * 5 / 9) * 100) / 100}°C**`;
})
	.setUsage('celsius (number)')
	.addAlias('celcius')
	.setDescription('convert fahrenheit to celsius')
	.addExample('celsius 59'));

cs.addCommand('utilities', new cs.SimpleCommand('kelvin', (message) => {
	const params = getParams(message);
	return `${params[0]}°C is ${Number(params[0]) < -273.15 ? `**physically impossible** ~~(buut would be **${Math.round((Number(params[0]) + 273.15) * 100) / 100}K**)~~` : `**${Math.round((Number(params[0]) + 273.15) * 100) / 100}K**`}`;
})
	.setUsage('kelvin (number)')
	.setDescription('convert celsius to kelvin')
	.addExample('kelvin 15'));

cs.addCommand('utilities', new cs.SimpleCommand('mbs', (message) => {
	const params = getParams(message);
	return `${params[0]}Mbps is **${Math.round((Number(params[0])) / 8 * 100) / 100}MB/s**`;
})
	.setUsage('mbs (number)')
	.addAlias('mb/s')
	.setDescription('convert mbps to mb/s')
	.addExample('mbs 8'));

cs.addCommand('utilities', new cs.SimpleCommand('mbps', (message) => {
	const params = getParams(message);
	return `${params[0]}MB/s is **${Math.round((Number(params[0])) * 800) / 100}Mbps**`;
})
	.setUsage('mbps (number)')
	.setDescription('convert mb/s to mbps')
	.addExample('mbps 1'));

cs.addCommand('utilities', new cs.Command('icon', (message) => {
	message.channel.send('', { files: [{ attachment: message.guild.iconURL, name: 'icon.png' }] });
})
	.setUsage('icon')
	.addAlias('servericon')
	.addAlias('serverpic')
	.setDescription('get the server\'s icon')
	.addClientPermission('ATTACH_FILES')
	.setGuildOnly());

cs.addCommand('utilities', new cs.Command('pfp', (msg) => {
	const params = getParams(msg);
	let user: Discord.User;

	if (params[0] !== undefined) {
		user = bot.users.get(params[0]);
	} else {
		user = msg.author;
	}
	msg.channel.send('', { files: [{ attachment: user.avatarURL, name: 'avatar.png' }] });
})
	.setUsage('pfp [id]')
	.addAlias('avatar')
	.setDescription('get a user\'s pfp')
	.addClientPermission('ATTACH_FILES'));

cs.addCommand('fun', new cs.SimpleCommand('kva', () => {
	return 'ква ква ква  гав гав гав    мяяяяяу   беееее  муууу  ку ку';
})
	.setHidden()
	.addAlias('ква')
	.setDescription('ква'));

cs.addCommand('fun', new FFMpegCommand('compress', () => [], (msg) => {
	const params: string[] = getParams(msg);
	if (!params[0]) { params[0] = '20'; }
	  return [`-b:v ${Math.abs(Number(params[0]))}k`, `-b:a ${Math.abs(Number(params[0]) - 3)}k`, '-c:a aac'];
})
	.setDescription('compresses a video')
	.addAlias('compression')
	.setUsage('compress [number]')
	.addClientPermission('ATTACH_FILES'));

cs.addCommand('fun', new cs.Command('eat', (msg) => {
	const params: string[] = getParams(msg);

	const eat: string = bot.emojis.get('612360473928663040').toString();
	const hamger1: string = bot.emojis.get('612360474293567500').toString();
	const hamger2: string = bot.emojis.get('612360473987252278').toString();
	const hamger3: string = bot.emojis.get('612360473974931458').toString();

	const insidehamger: string = params[0] ? params.join(' ') : hamger2;

	msg.channel.send(eat + hamger1 + insidehamger + hamger3).then((m) => {
		setTimeout(() => {
			m.edit(eat + insidehamger + hamger3).then((m) => {
				setTimeout(() => {
					m.edit(eat + hamger3).then((m) => {
						setTimeout(() => {
							m.edit(eat).then((m) => {
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
})
	.setDescription('eat the Burger')
	.setUsage('eat [any]')
	.addAlias('burger')
	.addClientPermission('USE_EXTERNAL_EMOJIS'));

cs.addCommand('fun', new cs.Command('valhalla', (msg) => {
	const params: string[] = getParams(msg);

	if (params[0] === 'search') {
		const founddrinks: any[] = [];
		const search: string = params.slice(1, params.length).join(' ');

		valhalladrinks.forEach((d) => {
			if (d.name.toLowerCase().includes(search.toLowerCase()) || d.flavour.toLowerCase() === search.toLowerCase()) {
				founddrinks.push(d);
			} else {
				d.type.forEach((f) => {
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
			founddrinks.slice(0, 5).forEach((d) => {
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

		params[1].split('').forEach((i) => {
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

		let drink: boolean;
		let drinkbig: boolean;
		valhalladrinks.forEach((d) => {
			if (adelhyde + bronson_extract + powdered_delta + flangerine + karmotrine > 20) { return; }

			drinkbig = adelhyde / 2 === d.ingredients.adelhyde
					&& bronson_extract / 2 === d.ingredients.bronson_extract
					&& powdered_delta / 2 === d.ingredients.powdered_delta
					&& flangerine / 2 === d.ingredients.flangerine
					&& (karmotrine / 2 === d.ingredients.karmotrine || d.ingredients.karmotrine === 'optional');

			if (adelhyde !== d.ingredients.adelhyde && (adelhyde / 2 !== d.ingredients.adelhyde || !drinkbig)) { return; }
			if (bronson_extract !== d.ingredients.bronson_extract && (bronson_extract / 2 !== d.ingredients.bronson_extract || !drinkbig)) { return; }
			if (powdered_delta !== d.ingredients.powdered_delta && (powdered_delta / 2 !== d.ingredients.powdered_delta || !drinkbig)) { return; }
			if (flangerine !== d.ingredients.flangerine && (flangerine / 2 !== d.ingredients.flangerine || !drinkbig)) { return; }
			if ((karmotrine !== d.ingredients.karmotrine && (karmotrine / 2 !== d.ingredients.karmotrine || !drinkbig)) && d.ingredients.karmotrine !== 'optional') { return; }

			if (blended !== d.blended) { return; }
			if (aged !== d.aged) { return; }
			if (iced !== d.iced) { return; }

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
})
	.addAlias('va11halla')
	.addAlias('vallhalla')
	.setUsage('valhalla ((search) (drink name) | (make) (ingredients marked by their first letter) [mixed?] [on the rocks?] [aged?])')
	.addExample('valhalla search Frothy Water')
	.addExample('valhalla make abpf aged')
	.addExample('valhalla aabbbbppffffkkkkkkkk')
	.setDescription('search up drinks, and make some drinks, va11halla style!\nbasically a text-based replica of the drink making part of va11halla'));

cs.addCommand('fun', new cs.SimpleCommand('nwordpass', (msg) => {
	const params: string[] = getParams(msg);

	if (params[0] === 'toggle') {
		userdata[msg.author.id].nworddisable = !userdata[msg.author.id].nworddisable;
		return `the system is now **${userdata[msg.author.id].nworddisable ? 'OFF' : 'ON'}**`;
	} else {
		return `You have:
	**${userdata[msg.author.id].nwordpasses}** N-Word passes [**${userdata[msg.author.id].nworddisable ? 'OFF' : 'ON'}**] (Use m=nwordpass toggle to disable/enable)
	You are: **\`[${'█'.repeat(Math.floor((userdata[msg.author.id].nwordpassxp / userdata[msg.author.id].nwordpassxpneeded) * 10))}${'_'.repeat(10 - (userdata[msg.author.id].nwordpassxp / userdata[msg.author.id].nwordpassxpneeded) * 10)}]\`** this close to getting another N-Word pass`;
	}
})
	.addAlias('nword')
	.addAlias('nwordpasses')
	.setDescription('see your amount of nwordpasses, or toggle the system')
	.setUsage('nwordpass [toggle]')
	.addExample('nwordpass toggle')
	.addExample('nwordpass'));

cs.addCommand('fun', new cs.SimpleCommand('rate', (msg) => {
	const params: string[] = getParams(msg);
	let thingToRate = params.join(' ');

	if (thingToRate.toLowerCase().startsWith('me') || thingToRate.toLowerCase().startsWith('my')) {
		// rate the user, not the string
		thingToRate += hashCode(msg.author.id.toString());
	} else if (thingToRate.toLowerCase().startsWith('this server') || thingToRate.toLowerCase().startsWith('this discord')) {
		// rate the server, not the string
		thingToRate = thingToRate + hashCode(msg.guild.id.toString());
	}
	const rating: number = seedAndRate(thingToRate.toLowerCase().split(' ').join(''));
	return `I'd give ${params.join(' ')} a **${rating}/10**`;
})
	.setDescription('rates something')
	.setUsage('rate (string)')
	.addExample('rate me'));

cs.addCommand('fun', new cs.SimpleCommand('pick', (msg) => {
	const params: string[] = getParams(msg);

	let thingToRate1: string = params[0];
	let thingToRate2: string = params[1];

	if (thingToRate1.toLowerCase().startsWith('me') || thingToRate1.toLowerCase().startsWith('my')) {
		thingToRate1 = thingToRate1 + hashCode(msg.author.id.toString());
	} else if (thingToRate1.toLowerCase().startsWith('this server') || thingToRate1.toLowerCase().startsWith('this discord')) {
		thingToRate1 = thingToRate1 + hashCode(msg.guild.id.toString());
	}

	if (thingToRate2.toLowerCase().startsWith('me') || thingToRate2.toLowerCase().startsWith('my')) {
		thingToRate2 = thingToRate2 + hashCode(msg.author.id.toString());
	} else if (thingToRate2.toLowerCase().startsWith('this server') || thingToRate2.toLowerCase().startsWith('this discord')) {
		thingToRate2 = thingToRate2 + hashCode(msg.guild.id.toString());
	}

	const rating1 = seedAndRate(thingToRate1.toLowerCase().split(' ').join(''));
	const rating2 = seedAndRate(thingToRate2.toLowerCase().split(' ').join(''));
	return `Out of ${params[0]} and ${params[1]}, I'd pick **${rating1 === rating2 ? 'neither' : (rating1 > rating2 ? thingToRate1 : thingToRate2)}**`;
})
	.addAlias('choose')
	.setDescription('rates 2 objects, and picks one of them')
	.setUsage('pick (string) (string)')
	.addExample('pick njs python'));

cs.addCommand('fun', new cs.SimpleCommand('ask', (msg) => {
	const thingToRate = getParams(msg).join(' ');
	return `> ${thingToRate}\nI'd say, **${['yes', 'probably', 'maybe', 'no'][Math.abs(hashCode(thingToRate)) * 23 % 4]}**`;
})
	.setDescription('ask the bot a question')
	.setUsage('ask (string)')
	.addAlias('askquestion')
	.addAlias('question')
	.addExample('ask is this a good example'));

cs.addCommand('fun', new cs.Command('achievement', (msg) => {
	const params: string[] = getParams(msg);
	msg.channel.send('', { files: [{ attachment: 'https://minecraftskinstealer.com/achievement/1/Achievement+Get%21/' + params.join('+'), name: 'achievement.png' }] });
})
	.addAlias('advancement')
	.setDescription('make a minecraft achievement')
	.setUsage('achievement (string)')
	.addExample('achievement Made an example!')
	.addClientPermission('ATTACH_FILES'));

cs.addCommand('fun', new cs.Command('foxquote', (msg) => {
	const randommsg: any = Object.values(foxquotes)[Math.floor(Math.random() * foxquotes.length)];
	if (randommsg === undefined) { return; }

	msg.channel.send('', new Discord.RichEmbed({
		author: { name: randommsg.author.username, icon_url: randommsg.author.avatarURL },
		timestamp: randommsg.createdTimestamp,
		description: randommsg.content,
	}));
})
	.setHidden()
	.setUsage('foxquote')
	.addAlias('quotefox')
	.setDescription('fetches a random quote said by fox')
	.addClientPermission('EMBED_LINKS'));

cs.addCommand('debug', new cs.SimpleCommand('permtest', () => {
	return 'yay, it worked!';
})
	.setHidden()
	.setGuildOnly()
	.setDebugOnly()
	.addUserPermission('MANAGE_MESSAGES')
	.addClientPermissions(['MANAGE_MESSAGES', 'BAN_MEMBERS'])
	.addAlias('permtestingalias'));

cs.addCommand('core', new cs.Command('info', (msg) => {
	msg.channel.send(new Discord.RichEmbed()
		.setFooter(`Made using Node.JS ${process.version}, Discord.JS v${packagelock.dependencies['discord.js'].version}`, bot.user.avatarURL)
		.setTitle(`${bot.user.username} stats`)
		.setURL(packagejson.repository)
		.setDescription(`Currently in ${bot.guilds.size} servers, with ${bot.channels.size} channels and ${bot.users.size} users`)
		.addField('Memory Usage', Math.round(process.memoryUsage().rss / 10000) / 100 + 'MB', true)
		.addField('CPU Usage', `Last second: **${roundNumber(cpuusage1sec, 3)}%**\nLast 30 seconds: **${roundNumber(cpuusage30sec, 3)}%**\nLast minute: **${roundNumber(cpuusagemin, 3)}%**\nRuntime: **${roundNumber(process.cpuUsage().user / (process.uptime() * 1000), 3)}%**`, true)
		.addField('Uptime', `${Math.round(process.uptime() / 76800)}d ${Math.round(process.uptime() / 3200)%24}h ${Math.round(process.uptime() / 60)%60}m ${Math.round(process.uptime())%60}s`, true));
})
	.addAlias('stats')
	.setDescription('get some info and stats about the bot'));

cs.addCommand('core', new cs.Command('foxstats', (msg) => {
	msg.channel.send(new Discord.RichEmbed()
		.setFooter(`Running on ${os.platform}/${os.type()} (${os.arch()})`)
		.setTitle(`Host's stats - ${os.hostname()}`)
		.setDescription(`Stats for the bot's host`)
		.addField('Uptime', `${Math.round(os.uptime() / 76800)}d ${Math.round(os.uptime() / 3200)%24}h ${Math.round(os.uptime() / 60)%60}m ${Math.round(os.uptime())%60}s`, true)
		.addField('Memory', `${roundNumber((os.totalmem()-os.freemem())/1000000, 3)}MB/${roundNumber(os.totalmem()/1000000, 3)}MB used`, true)
		.addField('CPU', `${os.cpus()[0].model}`, true))
})
	.addAliases(['matstatsfoxedition', 'hoststats', 'host', 'neofetch'])
	.setDescription('get some info and stats about the bot'));

cs.addCommand('core', new cs.SimpleCommand('prefix', (msg) => {
	const params: string[] = getParams(msg);
	if (!params[0]) { params[0] = prefix; }

	params[0] = params[0].toLowerCase();

	if (guildsettings[msg.guild.id]) {
		guildsettings[msg.guild.id] = params[0];
	} else {
		guildsettings[msg.guild.id] = {
			prefix: params[0],
		};
	}

	return `changed prefix to ${params[0]}`;
})
	.addAlias('setprefix')
	.addAlias('customprefix')
	.setDescription('set a custom prefix for boteline')
	.setUsage('prefix [string]')
	.addUserPermission('MANAGE_GUILD'));

cs.addCommand('utilities', new cs.Command('splatoon', (msg) => {
	checkSplatoon().then(obj => {
		let data = obj.data;

		let timeleft = Math.floor(data.league[0].end_time-Date.now()/1000);

		const regularemote = bot.emojis.get('639188039503183907') !== undefined ? bot.emojis.get('639188039503183907').toString()+' ' : ''
		const rankedemote = bot.emojis.get('639188039658242078') !== undefined ? bot.emojis.get('639188039658242078').toString()+' ' : ''
		const leagueemote = bot.emojis.get('639188038089703452') !== undefined ? bot.emojis.get('639188038089703452').toString()+' ' : ''

		let embed = new Discord.RichEmbed()
		.setTitle('Splatoon 2 Map Schedules')
		.addField(regularemote+'Regular Battle',
		`${data.regular[0].stage_a.name}, ${data.regular[0].stage_b.name}
		${data.regular[0].rule.name}`)
		.addField(rankedemote+'Ranked Battle',
		`${data.gachi[0].stage_a.name}, ${data.gachi[0].stage_b.name}
		${data.gachi[0].rule.name}`)
		.addField(leagueemote+'League Battle',
		`${data.league[0].stage_a.name}, ${data.league[0].stage_b.name}
		${data.league[0].rule.name}`)
		.setColor('22FF22')
		.setDescription(`${formatTime(new Date(data.league[0].start_time*1000))} - ${formatTime(new Date(data.league[0].end_time*1000))}
		${Math.floor(timeleft/60/60)%24}h ${Math.floor(timeleft/60)%60}m ${timeleft%60}s left`)
		.setURL('https://splatoon2.ink/')
		.setImage('https://splatoon2.ink/assets/splatnet'+data.regular[0].stage_a.image)
		.setFooter('Data last fetched '+obj.timer.toDateString()+', '+formatTime(obj.timer) + ' - Data provided by splatoon2.ink');

		msg.channel.send('', embed);
	});
})
	.addAlias('splatoonschedule')
	.addAlias('splatoon2')
	.setDescription('Check the schedule of the Splatoon 2 stage rotations')
	.addClientPermission('EMBED_LINKS'));

cs.addCommand('utilities', new cs.Command('salmonrun', (msg) => {
	checkSalmon().then(obj => {
		let data = obj.data;

		let timeleftend = Math.floor(data.details[0].end_time-Date.now()/1000);
		let timeleftstart = Math.floor(data.details[0].start_time-Date.now()/1000);

		let weapons = [];
		data.details[0].weapons.forEach(w => {
			weapons.push(w.weapon.name)
		})

		let embed = new Discord.RichEmbed()
		.setTitle('Splatoon 2 Salmon Run Schedule')
		.addField('Weapons',
		`${weapons.join(', ')}`)
		.addField('Map',
		`${data.details[0].stage.name}`)
		.setColor('FF9922')
		.setDescription(`${new Date(data.details[0].start_time*1000).toUTCString()} - ${new Date(data.details[0].end_time*1000).toUTCString()}
		${timeleftstart < 0 ? `${Math.floor(timeleftend/60/60)%24}h ${Math.floor(timeleftend/60)%60}m ${timeleftend%60}s left until end` : `${Math.floor(timeleftstart/60/60)%24}h ${Math.floor(timeleftstart/60)%60}m ${timeleftstart%60}s left until start`}`)
		.setURL('https://splatoon2.ink/')
		.setImage('https://splatoon2.ink/assets/splatnet'+data.details[0].stage.image)
		.setFooter('Data last fetched '+obj.timer.toDateString()+', '+formatTime(obj.timer) + ' - Data provided by splatoon2.ink');

		msg.channel.send('', embed);
	});
})
	.addAlias('salmon')
	.addAlias('salmonschedule')
	.setDescription('Check the schedule of the Splatoon 2 Salmon Run stage/weapon rotations')
	.addClientPermission('EMBED_LINKS'))

foxconsole.info('starting...');

bot.on('message', (msg) => {
	let content: string = msg.content;
	const author: Discord.User = msg.author;

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
			nworddisable: true,
		};
	}
	if (!userdata[author.id].nworddisable && !content.startsWith(prefix)) {
		// patch for old accounts
		if (!userdata[author.id].nwordpassxpneeded) {
			userdata[author.id].nwordpassxpneeded = 100 + userdata[author.id].nwordpasses * 50;
		}

		const count: number = (msg.content.toLowerCase().replace(' ', '').match(/nigg/g) || []).length;

		if (count === 0 && Date.now() > userdata[author.id].nextpass) {
			userdata[author.id].nwordpassxp += Math.floor(Math.random() * 10 + 5);
			userdata[author.id].nextpass = Date.now() + 120000;

			if (userdata[author.id].nwordpassxp > userdata[author.id].nwordpassxpneeded) {
				userdata[author.id].nwordpassxp -= 100;
				userdata[author.id].nwordpasses += 1;
				userdata[author.id].nwordpassxpneeded = 100 + userdata[author.id].nwordpasses * 50;
				msg.channel.send(`**${author.username}#${author.discriminator}** recieved an N-Word pass!`);
			}
		} else {
			if (count > userdata[author.id].nwordpasses) {
				if (msg.deletable) { msg.delete(); }
				msg.reply('you don\'t have enough N-Word passes!');
			} else if (count !== 0) {
				userdata[author.id].nwordpasses -= count;
				msg.channel.send(`:bangbang: ${msg.author.toString()} used ${count} N-Word ${count === 1 ? 'pass' : 'passes'}`);
				userdata[author.id].nwordpassxpneeded = 100 + userdata[author.id].nwordpasses * 50;
			}
		}
	}

	let thisprefix: string = prefix;

	if (msg.guild) {
		if (guildsettings[msg.guild.id]) {
			thisprefix = guildsettings[msg.guild.id].prefix;
		}
	}

	if (content.startsWith(thisprefix) || content.startsWith(prefix)) {
		content = content.slice(content.startsWith(thisprefix) ? thisprefix.length : prefix.length, content.length);
		const cmd: string = content.split(' ')[0];

		foxconsole.debug('got command ' + cmd);

		Object.values(cs.commands).forEach((cat) => {
			Object.values(cat).forEach((command) => {
				if ((command['name'] === cmd || command['aliases'].includes(cmd)) && 
				((msg.content.startsWith(thisprefix) || (msg.content.startsWith(prefix) && command['ignorePrefix'])) || (thisprefix == prefix)) && 
				(!command['debugOnly'] || process.env.DEBUG == 'true')) {
					command['runCommand'](msg, bot);
				}
			}); 
		});

		// debug and owneronly commands
		// not put into commandsystem for debugging if the system dies or something like that
		if (author.id === process.env.OWNER) {
			switch (cmd) {
			case 'debug':
				const clean = function(text) {
					if (typeof (text) === 'string') {
						text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
						return text;
					} else {
						return text;
					}
				};

				try {
					const code = content.replace(cmd + ' ', '');
					let evaled = eval(code);

					if (typeof evaled !== 'string') {
						evaled = require('util').inspect(evaled);
					}

					const embed = {
						title: 'Eval',
						color: '990000',
						fields: [{
							name: 'Input',
							value: '```xl\n' + code + '\n```',
							inline: true,
						},
						{
							name: 'Output',
							value: '```xl\n' + clean(evaled) + '\n```',
							inline: true,
						},
						],
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
	bot.fetchApplication().then((app) => {
		application = app;
	});

	foxconsole.info('doing post-login intervals...');

	const presences: [string, Discord.ActivityType][] = [['Celeste', 'PLAYING'], ['Celeste OST', 'LISTENING'], ['you', 'WATCHING'], ['sleep', 'PLAYING'], [`try ${process.env.PREFIX}help`, 'PLAYING'], [`Boteline v${version}`, 'STREAMING']];

	setInterval(() => {
		presences.push([`${bot.guilds.size} servers`, 'WATCHING']);
		presences.push([`with ${bot.users.size} users`, 'PLAYING']);

		const presence : [string, Discord.ActivityType] = presences[Math.floor(Math.random() * presences.length)];
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

		foxconsole.debug('saving guild settings...');
		fs.writeFile('./guildsettings.json', JSON.stringify(guildsettings), (err) => {
			if (err) {
				foxconsole.error('failed saving guildsettings: ' + err);
			} else {
				foxconsole.success('saved guild settings');
			}
		});

		if (!foxquotessaveneeded) { return; }
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

	cs.setBot(bot);

	foxconsole.success('ready!');
});

foxconsole.info('logging in...');
bot.login(process.env.TOKEN).then(() => {
	process.env.TOKEN = 'NTUxO_n1ceTryl0L-r9Pj8Y';
	bot.token = process.env.TOKEN
	foxconsole.info('patched out token');
});
