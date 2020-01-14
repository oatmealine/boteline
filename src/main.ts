// libraries & modules
import * as Discord from 'discord.js';
const bot = new Discord.Client({
	messageCacheMaxSize: 400,
	messageCacheLifetime: 600,
	messageSweepInterval: 100,
	disableEveryone: true,
	disabledEvents: ['RESUMED',
		'GUILD_BAN_ADD',
		'GUILD_BAN_REMOVE',
		'VOICE_STATE_UPDATE',
		'TYPING_START',
		'VOICE_SERVER_UPDATE',
		'RELATIONSHIP_ADD',
		'RELATIONSHIP_REMOVE',
		'WEBHOOKS_UPDATE'
	]
});

import * as cs from './commandsystem.js';

import * as foxConsole from './foxconsole.js';

import * as util from './util.js';

import {exec} from 'child_process';
import * as fs from 'fs';

import * as os from 'os';

import * as Wikiapi from 'wikiapi';

import { createCanvas, loadImage } from 'canvas';
import * as ffmpeg from 'fluent-ffmpeg';
import * as minesweeper from 'minesweeper';
import * as urban from 'urban';
import YandexTranslate from 'yet-another-yandex-translate';
import * as rq from 'request';
const yandex_langs = { 'Azerbaijan': 'az', 'Malayalam': 'ml', 'Albanian': 'sq', 'Maltese': 'mt', 'Amharic': 'am', 'Macedonian': 'mk', 'English': 'en', 'Maori': 'mi', 'Arabic': 'ar', 'Marathi': 'mr', 'Armenian': 'hy', 'Mari': 'mhr', 'Afrikaans': 'af', 'Mongolian': 'mn', 'Basque': 'eu', 'German': 'de', 'Bashkir': 'ba', 'Nepali': 'ne', 'Belarusian': 'be', 'Norwegian': 'no', 'Bengali': 'bn', 'Punjabi': 'pa', 'Burmese': 'my', 'Papiamento': 'pap', 'Bulgarian': 'bg', 'Persian': 'fa', 'Bosnian': 'bs', 'Polish': 'pl', 'Welsh': 'cy', 'Portuguese': 'pt', 'Hungarian': 'hu', 'Romanian': 'ro', 'Vietnamese': 'vi', 'Russian': 'ru', 'Haitian_(Creole)': 'ht', 'Cebuano': 'ceb', 'Galician': 'gl', 'Serbian': 'sr', 'Dutch': 'nl', 'Sinhala': 'si', 'Hill_Mari': 'mrj', 'Slovakian': 'sk', 'Greek': 'el', 'Slovenian': 'sl', 'Georgian': 'ka', 'Swahili': 'sw', 'Gujarati': 'gu', 'Sundanese': 'su', 'Danish': 'da', 'Tajik': 'tg', 'Hebrew': 'he', 'Thai': 'th', 'Yiddish': 'yi', 'Tagalog': 'tl', 'Indonesian': 'id', 'Tamil': 'ta', 'Irish': 'ga', 'Tatar': 'tt', 'Italian': 'it', 'Telugu': 'te', 'Icelandic': 'is', 'Turkish': 'tr', 'Spanish': 'es', 'Udmurt': 'udm', 'Kazakh': 'kk', 'Uzbek': 'uz', 'Kannada': 'kn', 'Ukrainian': 'uk', 'Catalan': 'ca', 'Urdu': 'ur', 'Kyrgyz': 'ky', 'Finnish': 'fi', 'Chinese': 'zh', 'French': 'fr', 'Korean': 'ko', 'Hindi': 'hi', 'Xhosa': 'xh', 'Croatian': 'hr', 'Khmer': 'km', 'Czech': 'cs', 'Laotian': 'lo', 'Swedish': 'sv', 'Latin': 'la', 'Scottish': 'gd', 'Latvian': 'lv', 'Estonian': 'et', 'Lithuanian': 'lt', 'Esperanto': 'eo', 'Luxembourgish': 'lb', 'Javanese': 'jv', 'Malagasy': 'mg', 'Japanese': 'ja', 'Malay': 'ms' };

let pm2;

try {
	pm2 = require('pm2');
	pm2.connect(function (err){
		if (err) throw err;
	});
} catch (err) {
	pm2 = null;
	foxConsole.warning('pm2 module doesnt exist, reboot will not exist');
}

const ch = require('chalk');
// files

const packageJson = JSON.parse(fs.readFileSync('./package.json', {encoding: 'utf8'}));
const packageLock = JSON.parse(fs.readFileSync('./package-lock.json', {encoding: 'utf8'}));

const userData = JSON.parse(util.readIfExists('./data/userdata.json', {encoding: 'utf8'}, '{}'));

const guildSettings = JSON.parse(util.readIfExists('./data/guildsettings.json', {encoding: 'utf8'}, '{}'));

const valhallaDrinks = JSON.parse(fs.readFileSync('./src/valhalla.json', {encoding: 'utf8'}));

// .env stuff
require('dotenv').config();
foxConsole.showDebug(process.env.DEBUG == 'true');

// constants & variables
const prefix : string = process.env.PREFIX;
cs.setPrefix(prefix);

const version : string = packageJson.version + ' alpha';

let application: Discord.OAuth2Application;

let starboardBinds = {};

// statistics

let cpuUsageMin: number = 0;
let cpuUsage30sec: number = 0;
let cpuUsage1sec: number = 0;

let cpuUsageMinOld = process.cpuUsage();
let cpuUsage30secOld = process.cpuUsage();
let cpuUsage1secOld = process.cpuUsage();

setInterval(() => {
	const usage = process.cpuUsage(cpuUsage1secOld);
	cpuUsage1sec = 100 * (usage.user + usage.system) / 1000000;
	cpuUsage1secOld = process.cpuUsage();
}, 1000);
setInterval(() => {
	const usage = process.cpuUsage(cpuUsage30secOld);
	cpuUsage30sec = 100 * (usage.user + usage.system) / 30000000;
	cpuUsage30secOld = process.cpuUsage();
}, 30000);
setInterval(() => {
	const usage = process.cpuUsage(cpuUsageMinOld);
	cpuUsageMin = 100 * (usage.user + usage.system) / 60000000;
	cpuUsageMinOld = process.cpuUsage();
}, 60000);

class FFMpegCommand extends cs.Command {
	public inputOptions: Function
	public outputOptions: Function

	constructor(name : string, inputOptions, outputOptions) {
		super(name, null);

		this.inputOptions = inputOptions;
		this.outputOptions = outputOptions;

		this.function = async (msg) => {
			const params = util.getParams(msg);
			const attachments = [];

			if (msg.attachments.size === 0) {
				await msg.channel.fetchMessages({limit: 20}).then((msges) => {
					msges.array().forEach((m : Discord.Message) => {
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
				let videoAttach : Discord.MessageAttachment;

				attachments.forEach((attachment) => {
					if (videoAttach || !attachment) { return; }

					const filetype = attachment.filename.split('.').pop();
					const acceptedFiletypes = ['apng', 'webm', 'swf', 'wmv', 'mp4', 'flv', 'm4a'];

					if (acceptedFiletypes.includes(filetype.toLowerCase())) {
						videoAttach = attachment;
					}
				});

				if (videoAttach) {
					let progMessage : Discord.Message;
					let lastEdit = 0; // to avoid ratelimiting

					msg.channel.send('ok, downloading...').then((m) => {
						progMessage = m;
					});
					msg.channel.startTyping();

					if (params[0]) {
						if (params[0].startsWith('.') || params[0].startsWith('/') || params[0].startsWith('~')) {
							if (progMessage) {
								progMessage.edit('i know exactly what you\'re doing there bud');
							} else {
								msg.channel.send('i know exactly what you\'re doing there bud');
							}
						}
					}

					ffmpeg(videoAttach.url)
						.inputOptions(this.inputOptions(msg))
						.outputOptions(this.outputOptions(msg))
						.on('start', (commandLine) => {
							foxConsole.info('started ffmpeg with command: ' + commandLine);
							if (progMessage) {
								progMessage.edit('processing: 0% (0s) done');
							}
						})
						.on('stderr', (stderrLine) => {
							foxConsole.debug('ffmpeg: ' + stderrLine);
						})
						.on('progress', (progress) => {
							if (lastEdit + 2000 < Date.now() && progMessage) {
								lastEdit = Date.now();
								progMessage.edit(`processing: **${progress.percent !== undefined ? Math.floor(progress.percent * 100) / 100 : '0.00'}%** \`(${progress.timemark})\``);
							}
						})
						.on('error', (err) => {
							msg.channel.stopTyping();
							foxConsole.warning('ffmpeg failed!');
							foxConsole.warning(err);
							if (progMessage) {
								progMessage.edit(`processing: error! \`${err}\``);
							} else {
								msg.channel.send(`An error has occured!: \`${err}\``);
							}
						})
						.on('end', () => {
							msg.channel.stopTyping();
							if (progMessage) {
								progMessage.edit('processing: done! uploading');
							}
							msg.channel.send('ok, done', {files: ['./temp/temp.mp4']}).then(() => {
								if (progMessage) {
									progMessage.delete();
								}
							});
						})
					// .pipe(stream);
						.save('./temp/temp.mp4');
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

class CanvasGradientApplyCommand extends cs.Command {
	public gradient : string[];
	public bottomstring : string;

	constructor(name : string, gradient : string[], bottomstring : string) {
		super(name, null);

		this.bottomstring = bottomstring;
		this.gradient = gradient;
		
		this.addClientPermission('ATTACH_FILES');
		this.setUsage('[user]');

		this.function = (msg : Discord.Message) => {
			msg.channel.startTyping();
			let params = util.getParams(msg);

			const canvas = createCanvas(300, 390);
			const ctx = canvas.getContext('2d');
			
			let user = params.length === 0 ? msg.author : util.parseUser(bot, params[0], msg.guild);
			
			if (user === null) {
				msg.channel.send('User not found');
				return;
			}

			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, 300, 390);

			let displayname = user.username;
			if (msg.guild && msg.guild.members.get(user.id)) {
				displayname = msg.guild.members.get(user.id).displayName;
			}
			
			ctx.font = '30px Impact';
			ctx.fillStyle = 'white';
			ctx.textAlign = 'center'; 
			ctx.fillText(displayname.toUpperCase() + ' is ' + bottomstring, 150, 340 + 15);
				
			loadImage(user.displayAvatarURL).then((image) => {
				ctx.drawImage(image, 10, 10, 280, 280);

				ctx.strokeStyle = 'white';
				ctx.lineWidth = 4;
				ctx.strokeRect(10, 10, 280, 280);
			
				let ctxGradient = ctx.createLinearGradient(0, 10, 0, 290);

				gradient.forEach((clr,i,arr) => {
					ctxGradient.addColorStop(i / (arr.length - 1), clr);
				});
				
				ctx.fillStyle = ctxGradient;
			
				ctx.fillRect(10,10,280,280);
				
				msg.channel.send('', {files: [canvas.toBuffer()]}).then(() => {
					msg.channel.stopTyping();
				});
			});
		};
		return this;
	}
}

console.log(ch.red.bold(`boteline v${version}`));
if (process.env.DEBUG) { console.debug(ch.grey('debug printing on')); }

process.title = `Starting Boteline v${version}`;

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
foxConsole.info('adding commands...');

// yandex translate api
let yt : YandexTranslate | null;
if (process.env.YANDEXTRANSLATETOKEN) {
	yt = new YandexTranslate(process.env.YANDEXTRANSLATETOKEN);
} else {
	yt = null;
}

// wikimedia api
const wiki = new Wikiapi('en');
const wikimc = new Wikiapi('https://minecraft.gamepedia.com/api.php');
const wikiterraria = new Wikiapi('https://terraria.gamepedia.com/api.php');

cs.addCommand('core', new cs.SimpleCommand('invite', () => {
	return `Invite me here: <https://discordapp.com/oauth2/authorize?client_id=${application.id}&scope=bot&permissions=314432>`;
})
	.setDescription('get the bot\'s invite')
	.addAlias('invitelink'));

cs.addCommand('moderating', new cs.SimpleCommand('ban', (message) => {
	const params = util.getParams(message);
	const banMember = message.guild.members.get(util.parseUser(bot, params[0], message.guild).id);

	if (banMember !== undefined) {
		if (banMember.id === message.user.id) {
			return 'hedgeberg#7337 is now b&. :thumbsup:'; // https://hedgeproofing.tech
		}

		if (banMember.bannable) {
			banMember.ban();
			return '✓ Banned ' + banMember.user.username;
		} else {
			return 'member ' + banMember.user.username + ' isn\'t bannable';
		}
	} else {
		return 'i don\'t know that person!';
	}
})
	.setUsage('(user)')
	.setDescription('ban a user')
	.addAlias('banuser')
	.addAlias('banmember')
	.addExample('360111651602825216')
	.addClientPermission('BAN_MEMBERS')
	.addUserPermission('BAN_MEMBERS')
	.setGuildOnly());

cs.addCommand('moderating', new cs.SimpleCommand('kick', (message) => {
	const params = message.content.split(' ').slice(1, message.content.length);
	const banMember = message.guild.members.get(util.parseUser(bot, params[0], message.guild).id);

	if (banMember !== undefined) {
		if (banMember.id === message.member.id) {
			return 'hedgeberg#7337 is now b&. :thumbsup:'; // https://hedgeproofing.tech
		}

		if (banMember.kickable) {
			banMember.ban();
			return '✓ Kicked ' + banMember.user.username;
		} else {
			return 'member ' + banMember.user.username + ' isn\'t kickable';
		}
	} else {
		return 'i don\'t know that person!';
	}
})
	.setUsage('(user)')
	.addAlias('kickuser')
	.addAlias('kickmember')
	.setDescription('kick a user')
	.addExample('360111651602825216')
	.addClientPermission('KICK_MEMBERS')
	.addUserPermission('KICK_MEMBERS')
	.setGuildOnly());

cs.addCommand('utilities', new cs.SimpleCommand('fahrenheit', (message) => {
	const params = util.getParams(message);
	return `${params[0]}°C is **${Math.round(((Number(params[0]) * 9 / 5) + 32) * 100) / 100}°F**`;
})
	.addAliases(['farenheit', 'farenheight', 'fairenheight', 'fairenheit', 'fahrenheight', 'americancelcius', 'stupidunit', 'notcelsius', 'notcelcius', 'weirdformulaunit', 'multiplyby1.8andadd32', '華氏', 'farandheight', 'westcelcius', 'unitusedbyonecountry', 'multiplybythesquarerootof3.24andadd8multipliedby4', 'multiplyby16.8minus6dividedby6andaddthesquarerootof1089minus1', 'solveaina=x*1.8+32ifx=', 'train1ismovingat1.8xthespeedoftrain2,howfarawayfromthestartinmetersistrain1ifitstarted32metersfurtherawaythantrain2andtrain2sdistancefromthestartinmetersis'])
	.setUsage('(number)')
	.setDescription('convert celsius to fahrenheit')
	.addExample('15'));

cs.addCommand('utilities', new cs.SimpleCommand('celsius', (message) => {
	const params = util.getParams(message);
	return `${params[0]}°F is **${Math.round(((Number(params[0]) - 32) * 5 / 9) * 100) / 100}°C**`;
})
	.setUsage('(number)')
	.addAlias('celcius')
	.setDescription('convert fahrenheit to celsius')
	.addExample('59'));

cs.addCommand('utilities', new cs.SimpleCommand('kelvin', (message) => {
	const params = util.getParams(message);
	return `${params[0]}°C is ${Number(params[0]) < -273.15 ? `**physically impossible** ~~(buut would be **${Math.round((Number(params[0]) + 273.15) * 100) / 100}K**)~~` : `**${Math.round((Number(params[0]) + 273.15) * 100) / 100}K**`}`;
})
	.setUsage('(number)')
	.setDescription('convert celsius to kelvin')
	.addExample('15'));

cs.addCommand('utilities', new cs.SimpleCommand('mbs', (message) => {
	const params = util.getParams(message);
	return `${params[0]}Mbps is **${Math.round((Number(params[0])) / 8 * 100) / 100}MB/s**`;
})
	.setUsage('(number)')
	.addAlias('mb/s')
	.setDescription('convert mbps to mb/s')
	.addExample('8'));

cs.addCommand('utilities', new cs.SimpleCommand('mbps', (message) => {
	const params = util.getParams(message);
	return `${params[0]}MB/s is **${Math.round((Number(params[0])) * 800) / 100}Mbps**`;
})
	.setUsage('(number)')
	.setDescription('convert mb/s to mbps')
	.addExample('1'));

cs.addCommand('utilities', new cs.Command('icon', (message) => {
	message.channel.send('', { files: [{ attachment: message.guild.iconURL, name: 'icon.png' }] });
})
	.addAlias('servericon')
	.addAlias('serverpic')
	.setDescription('get the server\'s icon')
	.addClientPermission('ATTACH_FILES')
	.setGuildOnly());

cs.addCommand('utilities', new cs.Command('pfp', (msg) => {
	const params = util.getParams(msg);
	let user: Discord.User;

	if (params[0] !== undefined) {
		user = util.parseUser(bot, params[0], msg.guild);
	} else {
		user = msg.author;
	}
	msg.channel.send('', { files: [{ attachment: user.displayAvatarURL, name: 'avatar.png' }] });
})
	.setUsage('[user]')
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
	const params = util.getParams(msg);
	if (!params[0]) { params[0] = '20'; }
	return [`-b:v ${Math.abs(Number(params[0]))}k`, `-b:a ${Math.abs(Number(params[0]) - 3)}k`, '-c:a aac'];
})
	.setDescription('compresses a video')
	.addAlias('compression')
	.setUsage('[number]')
	.addClientPermission('ATTACH_FILES')
	.setGlobalCooldown(1000)
	.setUserCooldown(5000));

cs.addCommand('fun', new cs.Command('eat', (msg) => {
	const params = util.getParams(msg);

	const eat = bot.emojis.get('612360473928663040').toString();
	const hamger1 = bot.emojis.get('612360474293567500').toString();
	const hamger2 = bot.emojis.get('612360473987252278').toString();
	const hamger3 = bot.emojis.get('612360473974931458').toString();

	const insideHamger: string = params[0] ? params.join(' ') : hamger2;

	msg.channel.send(eat + hamger1 + insideHamger + hamger3).then((m) => {
		bot.setTimeout(() => {
			m.edit(eat + insideHamger + hamger3).then((m) => {
				bot.setTimeout(() => {
					m.edit(eat + hamger3).then((m) => {
						bot.setTimeout(() => {
							m.edit(eat).then((m) => {
								bot.setTimeout(() => {
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
	.setUsage('[any]')
	.addAlias('burger')
	.addClientPermission('USE_EXTERNAL_EMOJIS'));

cs.addCommand('fun', new cs.Command('valhalla', (msg) => {
	const params = util.getParams(msg);

	if (params[0] === 'search') {
		const foundDrinks: any[] = [];
		const search = params.slice(1, params.length).join(' ');

		valhallaDrinks.forEach((d) => {
			if (d.name.toLowerCase().includes(search.toLowerCase()) || d.flavour.toLowerCase() === search.toLowerCase()) {
				foundDrinks.push(d);
			} else {
				d.type.forEach((f) => {
					if (search.toLowerCase() === f.toLowerCase()) {
						foundDrinks.push(d);
					}
				});
			}
		});

		if (foundDrinks.length < 1) {
			msg.channel.send(`Found no matches for \`${params[1]}\``);
		} else if (foundDrinks.length === 1) {
			msg.channel.send('', util.makeDrinkEmbed(foundDrinks[0]));
		} else {
			let founddrinksstr = '\n';
			foundDrinks.slice(0, 5).forEach((d) => {
				founddrinksstr = founddrinksstr + '**' + d.name + '**\n';
			});
			if (foundDrinks.length > 5) {
				founddrinksstr = founddrinksstr + `..and ${foundDrinks.length - 5} more drinks`;
			}

			msg.channel.send(`Found ${foundDrinks.length} drinks:\n${founddrinksstr}`);
		}
	} else if (params[0] === 'make') {
		let adelhyde = 0;
		let bronsonExtract = 0;
		let powderedDelta = 0;
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
				bronsonExtract += 1;
				break;
			case 'p':
				powderedDelta += 1;
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

		foxConsole.debug(`${adelhyde}, ${bronsonExtract}, ${powderedDelta}, ${flangerine}, ${karmotrine}`);
		foxConsole.debug(`${blended}, ${aged}, ${iced}`);

		let drink: boolean;
		let drinkBig: boolean;

		valhallaDrinks.forEach((d) => {
			if (adelhyde + bronsonExtract + powderedDelta + flangerine + karmotrine > 20) { return; }

			drinkBig = adelhyde / 2 === d.ingredients.adelhyde
					&& bronsonExtract / 2 === d.ingredients.bronson_extract
					&& powderedDelta / 2 === d.ingredients.powdered_delta
					&& flangerine / 2 === d.ingredients.flangerine
					&& (karmotrine / 2 === d.ingredients.karmotrine || d.ingredients.karmotrine === 'optional');

			if (adelhyde !== d.ingredients.adelhyde && (adelhyde / 2 !== d.ingredients.adelhyde || !drinkBig)) { return; }
			if (bronsonExtract !== d.ingredients.bronson_extract && (bronsonExtract / 2 !== d.ingredients.bronson_extract || !drinkBig)) { return; }
			if (powderedDelta !== d.ingredients.powdered_delta && (powderedDelta / 2 !== d.ingredients.powdered_delta || !drinkBig)) { return; }
			if (flangerine !== d.ingredients.flangerine && (flangerine / 2 !== d.ingredients.flangerine || !drinkBig)) { return; }
			if ((karmotrine !== d.ingredients.karmotrine && (karmotrine / 2 !== d.ingredients.karmotrine || !drinkBig)) && d.ingredients.karmotrine !== 'optional') { return; }

			if (blended !== d.blended) { return; }
			if (aged !== d.aged) { return; }
			if (iced !== d.iced) { return; }

			drink = d;
		});

		msg.channel.send(':timer: **Making drink...**').then((editmsg) => {
			bot.setTimeout(() => {
				if (drink === undefined) {
					editmsg.edit('Failed to make drink!');
				} else {
					editmsg.edit('Successfully made drink!' + (drinkBig ? ' (its big too, woah)' : ''), util.makeDrinkEmbed(drink));
				}
			}, blended ? 7000 : 3000);
		});
	}
})
	.addAlias('va11halla')
	.setUsage('(string) (string) [string] [string] [string]')
	.setDisplayUsage('valhalla ((search) (drink name) | (make) (ingredients marked by their first letter) [mixed?] [on the rocks?] [aged?])')
	.addExample('search Frothy Water')
	.addExample('make abpf aged')
	.addExample('make aabbbbppffffkkkkkkkk')
	.setDescription('search up drinks, and make some drinks, va11halla style!\nbasically a text-based replica of the drink making part of va11halla'));

cs.addCommand('fun', new cs.SimpleCommand('rate', (msg) => {
	const params = util.getParams(msg);
	let thingToRate = params.join(' ').toLowerCase().split(' ').join('');

	if (thingToRate.startsWith('me') || thingToRate.startsWith('my')) {
		// rate the user, not the string
		thingToRate += util.hashCode(msg.author.id);
	} else if (thingToRate.startsWith('thisserver') || thingToRate.startsWith('thisdiscord')) {
		// rate the server, not the string
		thingToRate += util.hashCode(msg.guild.id);
	}

	const rating = util.seedAndRate(thingToRate);

	return `I'd give ${params.join(' ').replace('me', 'you').replace('my', 'your')} a **${rating}/10**`;
})
	.setDescription('rates something')
	.setUsage('(string)')
	.addExample('me'));

cs.addCommand('fun', new cs.SimpleCommand('pick', (msg) => {
	const params = util.getParams(msg);

	let thingToRate1: string = params[0].toLowerCase();
	let thingToRate2: string = params[1].toLowerCase();

	if (thingToRate1.startsWith('me') || thingToRate1.startsWith('my')) {
		thingToRate1 = thingToRate1 + util.hashCode(msg.author.id);
	} else if (thingToRate1.startsWith('thisserver') || thingToRate1.startsWith('thisdiscord')) {
		thingToRate1 = thingToRate1 + util.hashCode(msg.guild.id);
	}

	if (thingToRate2.startsWith('me') || thingToRate2.toLowerCase().startsWith('my')) {
		thingToRate2 = thingToRate2 + util.hashCode(msg.author.id);
	} else if (thingToRate2.startsWith('thisserver') || thingToRate2.startsWith('thisdiscord')) {
		thingToRate2 = thingToRate2 + util.hashCode(msg.guild.id);
	}

	const rating1 = util.seedAndRate(thingToRate1);
	const rating2 = util.seedAndRate(thingToRate2);
	return `Out of ${params[0]} and ${params[1]}, I'd pick **${rating1 === rating2 ? 'neither' : (rating1 > rating2 ? thingToRate1 : thingToRate2)}**`;
})
	.addAlias('choose')
	.setDescription('rates 2 objects, and picks one of them')
	.setUsage('(string) (string)')
	.addExample('njs python'));

cs.addCommand('fun', new cs.SimpleCommand('ask', (msg) => {
	const params = util.getParams(msg);
	const thingToRate = params.join(' ').toLowerCase();
	const options = ['ohh fuck yea', 'yes', 'maybe', 'no', 'god no'];
	let rating = Math.round((1 - util.normalDistribution((Math.abs(util.hashCode(thingToRate)) / 10) % 2 - 1)) / 2 * 8);

	return `> ${params.join(' ')}\n${options[rating]}`;
})
	.setDescription('ask the bot a question')
	.setUsage('(string)')
	.addAlias('askquestion')
	.addAlias('question')
	.addExample('is this a good example'));

cs.addCommand('fun', new cs.Command('achievement', (msg) => {
	const params = util.getParams(msg);
	msg.channel.send('', { files: [{ attachment: 'https://minecraftskinstealer.com/achievement/1/Achievement+Get%21/' + encodeURI(params.join('+')), name: 'achievement.png' }] });
})
	.addAlias('advancement')
	.setDescription('make a minecraft achievement')
	.setUsage('(string)')
	.addExample('Made an example!')
	.addClientPermission('ATTACH_FILES'));

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
		.setFooter(`Made using Node.JS ${process.version}, TypeScript ${packageLock.dependencies['typescript'].version}, Discord.JS v${packageLock.dependencies['discord.js'].version}`, bot.user.displayAvatarURL)
		.setTitle(`${bot.user.username} stats`)
		.setURL(packageJson.repository)
		.setDescription(`Currently in ${bot.guilds.size} servers, with ${bot.channels.size} channels and ${bot.users.size} users`)
		.addField('Memory Usage', util.formatFileSize(process.memoryUsage().rss), true)
		.addField('CPU Usage', `Last second: **${util.roundNumber(cpuUsage1sec, 3)}%**
Last 30 seconds: **${util.roundNumber(cpuUsage30sec, 3)}%**
Last minute: **${util.roundNumber(cpuUsageMin, 3)}%**
Runtime: **${util.roundNumber(process.cpuUsage().user / (process.uptime() * 1000), 3)}%**`, true)
		.addField('Uptime', util.formatMiliseconds(process.uptime()), true));
})
	.addAlias('stats')
	.setDescription('get some info and stats about the bot'));

cs.addCommand('core', new cs.Command('hoststats', (msg) => {
	let memtotal = util.formatFileSize(os.totalmem());
	let memused = util.formatFileSize(os.totalmem() - os.freemem());

	msg.channel.send(new Discord.RichEmbed()
		.setFooter(`Running on ${os.platform}/${os.type()} (${os.arch()}) version ${os.release()}`)
		.setTitle(`Host's stats - ${os.hostname()}`)
		.setDescription('Stats for the bot\'s host')
		.addField('Uptime', util.formatMiliseconds(os.uptime()), true)
		.addField('Memory', `${memused}/${memtotal} used`, true)
		.addField('CPU', `${os.cpus()[0].model}`, true));
})
	.addAliases(['matstatsoatedition', 'oatstats', 'host', 'neofetch'])
	.setDescription('get some info and stats about the bot'));

cs.addCommand('core', new cs.SimpleCommand('prefix', (msg) => {
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
	.addAlias('setprefix')
	.addAlias('customprefix')
	.setDescription('set a custom prefix for boteline')
	.setUsage('[string]')
	.addUserPermission('MANAGE_GUILD'));

cs.addCommand('utilities', new cs.Command('splatoon', (msg) => {
	util.checkSplatoon().then(obj => {
		let data = obj.data;

		let timeLeft = Math.floor(data.league[0].end_time-Date.now()/1000);

		const regularemote = bot.emojis.get('639188039503183907') !== undefined ? bot.emojis.get('639188039503183907').toString()+' ' : '';
		const rankedemote = bot.emojis.get('639188039658242078') !== undefined ? bot.emojis.get('639188039658242078').toString()+' ' : '';
		const leagueemote = bot.emojis.get('639188038089703452') !== undefined ? bot.emojis.get('639188038089703452').toString()+' ' : '';

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
			.setDescription(`${util.formatTime(new Date(data.league[0].start_time*1000))} - ${util.formatTime(new Date(data.league[0].end_time*1000))}
${Math.floor(timeLeft/60/60)%24}h ${Math.floor(timeLeft/60)%60}m ${timeLeft%60}s left`)
			.setURL('https://splatoon2.ink/')
			.setImage('https://splatoon2.ink/assets/splatnet'+data.regular[0].stage_a.image)
			.setFooter('Data last fetched '+obj.timer.toDateString()+', '+util.formatTime(obj.timer) + ' - Data provided by splatoon2.ink');

		msg.channel.send('', embed);
	});
})
	.addAlias('splatoonschedule')
	.addAlias('splatoon2')
	.setDescription('Check the schedule of the Splatoon 2 stage rotations')
	.addClientPermission('EMBED_LINKS'));

cs.addCommand('utilities', new cs.Command('salmonrun', (msg) => {
	util.checkSalmon().then(obj => {
		let data = obj.data;

		let timeLeftEnd = Math.floor(data.details[0].end_time-Date.now()/1000);
		let timeLeftStart = Math.floor(data.details[0].start_time-Date.now()/1000);

		let weapons = [];
		data.details[0].weapons.forEach(w => {
			weapons.push(w.weapon.name);
		});

		let embed = new Discord.RichEmbed()
			.setTitle('Splatoon 2 Salmon Run Schedule')
			.addField('Weapons',
				`${weapons.join(', ')}`)
			.addField('Map',
				`${data.details[0].stage.name}`)
			.setColor('FF9922')
			.setDescription(`${new Date(data.details[0].start_time*1000).toUTCString()} - ${new Date(data.details[0].end_time*1000).toUTCString()}
		${timeLeftStart < 0 ? `${Math.floor(timeLeftEnd/60/60)%24}h ${Math.floor(timeLeftEnd/60)%60}m ${timeLeftEnd%60}s left until end` : `${Math.floor(timeLeftStart/60/60)%24}h ${Math.floor(timeLeftStart/60)%60}m ${timeLeftStart%60}s left until start`}`)
			.setURL('https://splatoon2.ink/')
			.setImage('https://splatoon2.ink/assets/splatnet'+data.details[0].stage.image)
			.setFooter('Data last fetched '+obj.timer.toDateString()+', '+util.formatTime(obj.timer) + ' - Data provided by splatoon2.ink');

		msg.channel.send('', embed);
	});
})
	.addAlias('salmon')
	.addAlias('salmonschedule')
	.setDescription('Check the schedule of the Splatoon 2 Salmon Run stage/weapon rotations')
	.addClientPermission('EMBED_LINKS'));

cs.addCommand('fun', new cs.SimpleCommand('isgay', (msg) => {
	let params = util.getParams(msg);
	let ratingThing = params.join(' ').toLowerCase();

	const transOverride = ['duck', 'oatmealine', 'oat', 'jill', 'ladizi', 'lavie', 'arceus', 'leah'];
	const enbyOverride = ['jude'];
	const gayOverride = ['discord', 'oat', 'jill', 'oatmealine', 'ur mom'];
	const biOverride = [];
	const aceOverride = ['catte'];

	let ratedHash = util.hashCode(ratingThing);
	let ratedHashUpper = util.hashCode(ratingThing);

	let isGay = (ratedHash % 3) === 0 || gayOverride.includes(ratingThing);
	let isBi = (ratedHashUpper % 4) === 0 || biOverride.includes(ratingThing);
	let isAce = (ratedHash % 16) === 0 || aceOverride.includes(ratingThing);
	let isTrans = ((ratedHashUpper % 5) === 0) || transOverride.includes(ratingThing);
	let isEnby = ((ratedHashUpper % 10) === 0) || enbyOverride.includes(ratingThing);

	let sexuality = '';
	if (isGay) sexuality = 'gay';
	if (isBi) sexuality = 'bi';
	if (isAce) sexuality = 'asexual';

	return `**${params.join(' ')}** is ${sexuality !== '' ? sexuality : (isTrans || isEnby ? '' : 'not gay')}${(sexuality !== '' && (isTrans || isEnby)) ? ' and ' : ''}${(isTrans || isEnby ? (isEnby ? 'non-binary' : 'trans') : '')}!`;
})
	.addAlias('istrans')
	.addAlias('isenby')
	.addAlias('isbi')
	.setDescription('check if something is lgbtq or not and which part it is')
	.addExample('jill')
	.setUsage('(string)')
	.setDisplayUsage('(thing to test)'));

cs.addCommand('image', new CanvasGradientApplyCommand('gay',
	['rgba(255,0,0,0.5)',
		'rgba(255,127,0,0.5)',
		'rgba(255,255,0,0.5)',
		'rgba(0,255,0,0.5)',
		'rgba(0,255,255,0.5)',
		'rgba(0,0,255,0.5)',
		'rgba(255,0,255,0.5)'],
	'GAY')
	.setDescription('puts a gay (homosexual) flag over your (or someone else\'s) icon')
	.addAlias('gayoverlay')
	.setGlobalCooldown(100)
	.setUserCooldown(1000));

cs.addCommand('image', new CanvasGradientApplyCommand('trans',
	['rgba(85,205,252,0.6)',
		'rgba(247,168,184,0.6)',
		'rgba(255,255,255,0.6)',
		'rgba(247,168,184,0.6)',
		'rgba(85,205,252,0.6)'],
	'TRANS')
	.setDescription('puts a trans (transgender) flag over your (or someone else\'s) icon')
	.addAlias('transoverlay')
	.setGlobalCooldown(100)
	.setUserCooldown(1000));

cs.addCommand('image', new CanvasGradientApplyCommand('bi',
	['rgba(214,2,112,0.6)',
		'rgba(214,2,112,0.6)',
		'rgba(155,79,150,0.6)',
		'rgba(0,56,168,0.6)',
		'rgba(0,56,168,0.6)'],
	'BI')
	.setDescription('puts a bi (bisexual) flag over your (or someone else\'s) icon')
	.addAlias('bioverlay')
	.setGlobalCooldown(100)
	.setUserCooldown(1000));

cs.addCommand('image', new CanvasGradientApplyCommand('enby',
	['rgba(255,244,51,0.6)',
		'rgba(255,255,255,0.6)',
		'rgba(155,89,208,0.6)',
		'rgba(0,0,0,0.6)'],
	'ENBY')
	.setDescription('puts an enby (non-binary) flag over your (or someone else\'s) icon')
	.addAlias('enbyoverlay')
	.setGlobalCooldown(100)
	.setUserCooldown(1000));

cs.addCommand('image', new CanvasGradientApplyCommand('pan',
	['rgba(255, 27, 141,0.6)',
		'rgba(255, 218, 0,0.6)',
		'rgba(27, 179, 255,0.6)'],
	'PAN')
	.setDescription('puts a pan (pansexual) flag over your (or someone else\'s) icon')
	.addAlias('panoverlay')
	.setGlobalCooldown(100)
	.setUserCooldown(1000));

cs.addCommand('image', new CanvasGradientApplyCommand('ace',
	['rgba(0, 0, 0,0.6)',
		'rgba(127, 127, 127,0.6)',
		'rgba(255, 255, 255,0.6)',
		'rgba(102, 0, 102,0.6)'],
	'ASEXUAL')
	.setDescription('puts a ace (asexual) flag over your (or someone else\'s) icon')
	.addAlias('aceoverlay')
	.setGlobalCooldown(100)
	.setUserCooldown(1000));

cs.addCommand('image', new CanvasGradientApplyCommand('lesbian',
	['rgba(214, 41, 0,0.6)',
		'rgba(255, 155, 85,0.6)',
		'rgba(255, 255, 255,0.6)',
		'rgba(212, 97, 166,0.6)',
		'rgba(165, 0, 98,0.6)'],
	'LESBIAN')
	.setDescription('puts a lesbian flag over your (or someone else\'s) icon')
	.addAlias('lesbianoverlay')
	.setGlobalCooldown(100)
	.setUserCooldown(1000));

if (yt !== null) {
	cs.addCommand('utilities', new cs.Command('autotranslate', (msg : Discord.Message) => {
		let params = util.getParams(msg);
		let lang = params[0];
		params.shift();

		msg.channel.startTyping();

		yt.translate(params.join(' '), {to: lang, format: 'plain'}).then(translated => {
			let translateEmbed = new Discord.RichEmbed()
				.setDescription(translated)
				.setTitle(`\`${util.shortenStr(params.join(' '), 50).split('\n').join(' ')}\` translated to ${lang} will be...`)
				.setFooter('Powered by Yandex.Translate')
				.setColor('#FF0000');
			msg.channel.send('', {embed: translateEmbed});
			msg.channel.stopTyping();
		})
			.catch(err => {
				msg.channel.send('An error occured! `'+err+'`\nThis is likely Yandex.Translate\'s fault, so blame them');
				msg.channel.stopTyping();
			});
	})
		.addClientPermission('EMBED_LINKS')
		.setDescription(prefix + 'translate, but with the first language set to auto')
		.addAlias('atransl')
		.addAlias('atr')
		.setUsage('(string) (string)')
		.setDisplayUsage('(language to translate to) (text, language is autodetected)')
		.addExample('en тестируем ботелине')
		.setGlobalCooldown(500)
		.setUserCooldown(1000));

	cs.addCommand('utilities', new cs.Command('translate', (msg : Discord.Message) => {
		let params = util.getParams(msg);
		let langfrom = params[0];
		let langto = params[1];
		params.splice(0, 2);

		msg.channel.startTyping();

		yt.translate(params.join(' '), {from: langfrom, to: langto, format: 'plain'}).then(translated => {
			let translateEmbed = new Discord.RichEmbed()
				.setDescription(translated)
				.setTitle(`\`${util.shortenStr(params.join(' '), 50).split('\n').join(' ')}\` translated from ${langfrom} to ${langto} will be...`)
				.setFooter('Powered by Yandex.Translate')
				.setColor('#FF0000');
			msg.channel.send('', {embed: translateEmbed});
			msg.channel.stopTyping();
		})
			.catch(err => {
				msg.channel.send('An error occured! `'+err+'`\nThis is likely Yandex.Translate\'s fault, so blame them');
				msg.channel.stopTyping();
			});
	})
		.addClientPermission('EMBED_LINKS')
		.setDescription('translate some text, get accepted langs list with '+prefix+'langs')
		.addAlias('transl')
		.addAlias('tr')
		.setUsage('(string) (string) (string)')
		.setDisplayUsage('(language to translate from) (language to translate to) (text)')
		.addExample('ru en тестируем ботелине')
		.setGlobalCooldown(500)
		.setUserCooldown(1000));

	cs.addCommand('fun', new cs.Command('masstranslate', async (msg : Discord.Message) => {
		let params = util.getParams(msg);
		let times = Number(params[0]);

		if (times > 25) {
			msg.channel.send('count cannot be over 25');
			return;
		}

		let forcelang : string = null;
		let mode : number;
		let cutoff = 2;
		switch(params[1]) {
		case 'curated':
			mode = 0; break;
		case 'normal':
			mode = 1; break;
		case 'auto':
			mode = 2; break;
		case 'hard':
			mode = 3; break;
		default:
			if (Object.values(yandex_langs).includes(params[1])) {
				mode = 4;
				forcelang = params[1];
			} else {
				mode = 0;
				cutoff = 1;
			}
			break;
		case 'legacy':
			mode = 5; break;
		}

		params.splice(0, cutoff);

		// stupid hack . Im sorry in advance
		let progMessage;
		let progUpdateTimeout = 0;
		await msg.channel.send(`getting languages... (mode ${mode})`).then(m => {
			progMessage = m;
		});

		let langCodes = [];
		if (mode === 0) {
			langCodes = ['az', 'mt', 'hy', 'mhr', 'bs', 'cy', 'vi', 'ht', 'ceb', 'gl', 'mrj', 'el', 'da', 'gu', 'su', 'tg', 'th', 'he', 'ga', 'tt', 'tr', 'kk', 'uz', 'ur', 'xh', 'lv', 'lb', 'jv', 'ja'];
		} else if (mode === 5) {
			let langs = await yt.getLangs();

			langs.dirs.forEach(l => {
				l.split('-').forEach(lang => {
					if (!langCodes.includes(lang)) langCodes.push(lang);
				});
			});
		} else {
			langCodes = Object.values(yandex_langs);
		}

		let text = params.join(' ');
		let randLangs = [];
		if (mode === 4) {
			let origlang = await yt.detect(params.join(' '));
			randLangs = Array(times).fill('').map((v,i) => (i%2 === 0) ? forcelang : origlang);
		} else {
			randLangs = Array(times).fill('').map(() => langCodes[Math.floor(Math.random()*langCodes.length)]);
		}
		
		for(let i = 0; i < times; i++) {
			let fromLang = randLangs[i-1];
			if (mode === 2) fromLang = undefined;
			if (mode === 3) fromLang = langCodes[Math.floor(Math.random()*langCodes.length)];

			text = await yt.translate(text, {from: fromLang, to: randLangs[i], format: 'plain'});

			if (progUpdateTimeout < Date.now() - 1000) {
				progMessage.edit(`masstranslating using mode ${mode}... ${i+1}/${times} \`[${util.progress(i, times, 10)}]\`
${randLangs.map((lang, ind) => (ind === i) ? '**' + lang + '**' : lang).join(', ')}`);
				progUpdateTimeout = Date.now() + 1000;
			}
		}

		progMessage.edit('converting back to english...');
		text = await yt.translate(text, {from: randLangs[times], to: 'en', format: 'plain'});

		let translateEmbed = new Discord.RichEmbed()
			.setDescription(text)
			.setTitle(`\`${util.shortenStr(params.join(' '), 100).split('\n').join(' ')}\` translated ${times} times will be...`)
			.setFooter('Powered by Yandex.Translate, mode '+mode)
			.setColor('#FF0000');
		progMessage.edit('', {embed: translateEmbed});
	})
		.addClientPermission('EMBED_LINKS')
		.setDescription(`translate a piece of text back and forth a certain amount of times to random languages before translating it back to english. will mostly return gibberish if set to a high value
modes are normal, hard, curated, (langname), legacy`)
		.addAlias('masstransl')
		.addAlias('mtr')
		.setUsage('(number) (string) [string]')
		.setDisplayUsage('(how many times to translate it) [mode] (text, language is autodetected)')
		.addExample('5 this piece of text will likely come out as garbage! but fun garbage at that. try it out!')
		.addExample('5 ja this text will be translated back and forth inbetween english and japanese')
		.setGlobalCooldown(700)
		.setUserCooldown(3000));

	cs.addCommand('utilities', new cs.Command('langs', (msg : Discord.Message) => {
		msg.channel.send('The supported languages for '+prefix+'translate are:\n`' + Object.values(yandex_langs).join('`, `') + '`');
	})
		.setDescription('get the available languages for '+prefix+'translate'));
}

cs.addCommand('core', new cs.Command('listdependencies', (msg) => {
	let dependencyEmbed = new Discord.RichEmbed()
		.setTitle('Boteline Dependencies')
		.setColor('#FFFF00')
		.setDescription('Dependencies taken from package.json, dependency versions taken from package-lock.json');
	
	Object.keys(packageJson.dependencies).forEach((dependency : string) => {
		if (!dependency.startsWith('@') && packageLock.dependencies[dependency] !== undefined) dependencyEmbed.addField(dependency, packageLock.dependencies[dependency].version, true);
	});

	msg.channel.send('', {embed: dependencyEmbed});
})
	.addAlias('dependencies')
	.addAlias('depends')
	.addClientPermission('EMBED_LINKS')
	.setDescription('list the dependencies boteline uses, and their versions'));

cs.addCommand('moderating', new cs.Command('starboard', (msg : Discord.Message) => {
	let params = util.getParams(msg);

	let channel = msg.guild.channels.find(c => c.id === params[0].replace('<#','').replace('>',''));
	if(!channel) {
		return msg.channel.send('channel doesnt exist!');
	} else {
		if(!channel.memberPermissions(msg.guild.me).hasPermission('SEND_MESSAGES')) return msg.channel.send('i cant send messages there!');
		if(!channel.memberPermissions(msg.guild.me).hasPermission('EMBED_LINKS')) return msg.channel.send('i cant add embeds there!');
	}

	if (!params[2]) params[2] = '⭐';
	let emote = msg.guild.emojis.find(em => em.id === params[2].slice(-19,-1));

	if (!guildSettings[msg.guild.id]) guildSettings[msg.guild.id] = {};

	if (params[1] !== '0') {
		guildSettings[msg.guild.id].starboard = {channel: channel.id, starsNeeded: Number(params[1]), emote: emote ? emote.id : params[2], guildEmote: emote !== null};

		let starSettings = guildSettings[msg.guild.id].starboard;
		return msg.channel.send(`gotcha! all messages with ${starSettings.starsNeeded} ${starSettings.guildEmote ? msg.guild.emojis.get(starSettings.emote).toString() : starSettings.emote} reactions will be quoted in <#${starSettings.channel}>`);
	} else {
		delete guildSettings[msg.guild.id].starboard;
		return msg.channel.send('removed starboard from server!');
	}
})
	.addAlias('board')
	.addAlias('setStarboard')
	.addUserPermission('MANAGE_CHANNELS')
	.addClientPermission('MANAGE_MESSAGES')
	.setUsage('(string) (number) [string]')
	.setDisplayUsage('(channel) (reacts needed) [emote]')
	.setDescription('changes the starboard location, set reacts needed to 0 to remove')
	.setGuildOnly());

cs.addCommand('fun', new cs.SimpleCommand('minesweeper', (msg) => {
	const params = util.getParams(msg);
	const board = new minesweeper.Board(minesweeper.generateMineArray({
		rows: Math.min(100, Number(params[0])),
		cols: Math.min(100, Number(params[1])),
		mines: params[2]
	}));

	let gridstring = '||' + board.grid()
		.map(ar => ar.map(t => 
			t.isMine ? ':bomb:' : `:${util.decimalToNumber(t.numAdjacentMines)}:`.replace(':zero:', ':white_large_square:')
		).join('||||')
		).join('||\n||') + '||';

	if (gridstring.length >= 2000) {
		return 'The grid is too large to put in a 2000 char message!';
	}

	return gridstring;
})
	.addAlias('msw')
	.addExample('10 10 6')
	.setUsage('(number) (number) (number)')
	.setDisplayUsage('(width) (height) (mines)')
	.setDescription('play minesweeper with discord spoilers'));

cs.addCommand('utilities', new cs.Command('urban', msg => {
	const params = util.getParams(msg);
	let word = urban(params.join(' '));
	if (!params[0]) word = urban.random();

	word.first(json => {
		if (json) {
			if (json.example === '') {json.example = '(no example given)';}

			let embed = new Discord.RichEmbed()
				.setTitle(json.word)
				.setURL(json.permalink)
				// the written_on thing is like that because of the date format being:
				// YYYY-mm-ddT00:00:00.000Z
				// note that the last time is always 0:00
				.setDescription(`written on ${json.written_on.slice(0, 10)} by ${json.author}\n${json.thumbs_up || '??'} :thumbsup: ${json.thumbs_down || '??'} :thumbsdown:`)
				.addField('Defintion', util.shortenStr(util.replaceUrbanLinks(json.definition), 1021), true)
				.addField('Example', util.shortenStr(util.replaceUrbanLinks(json.example), 1021), false);

			msg.channel.send('', embed);
		} else {
			msg.channel.send('that word doesnt exist!');
		}
	});
})
	.addAlias('urb')
	.addAlias('urbandict')
	.addExample('discord')
	.setUsage('[string]')
	.setDisplayUsage('[word]')
	.setDescription('check the definition of a word on urban dictionary')
	.addClientPermission('EMBED_LINKS'));

cs.addCommand('fun', new cs.Command('inspirobot', msg => {
	msg.channel.startTyping();
	rq('http://inspirobot.me/api?generate=true', (err, res, body) => {
		if (res && res.statusCode == 200) {
			msg.channel.send({files: [body]}).then(() => {
				msg.channel.stopTyping();
			});
		}
	});
})
	.addClientPermission('ATTACH_FILES')
	.setGlobalCooldown(1000)
	.setDescription('fetch an inspiring ai-generated quote from [inspirobot](http://inspirobot.me/)')
	.addAlias('insp'));

cs.addCommand('moderating', new cs.SimpleCommand('blacklistuser', msg => {
	const params = util.getParams(msg);
	let blacklistcmds = [];

	if (params[0] === process.env.OWNER) return 'you can\'t blacklist the owner!';
	if (params[1]) blacklistcmds = params.slice(1);
	if (!userData[params[0]]) userData[msg.author] = {};

	if (blacklistcmds.length > 0) {
		userData[params[0]].blacklist = blacklistcmds;
		if (blacklistcmds.includes('.')) return `ok, blacklisted userid ${params[0]} from any commands`;
		return `ok, blacklisted userid ${params[0]} from accessing commands \`${blacklistcmds.join(', ')}\``;
	} else {
		userData[params[0]].blacklist = [];
		return `ok, removed blacklist from userid ${params[0]}`;
	}
})
	.addExample('209765088196821012 .')
	.addExample('209765088196821012 translate autotranslate masstranslate')
	.setOwnerOnly()
	.setDescription('prevent a user from accessing commands (set to . for all commands, provide no second argument for remove)')
	.setUsage('(number) [string]')
	.setDisplayUsage('(userid) [command]..'));

cs.addCommand('wiki', new cs.Command('wiki', async msg => {
	const params = util.getParams(msg);
	let page_data = await wiki.page(params.join(' '));

	if (page_data.wikitext < 0) {
		msg.channel.send('page not found!');
	} else {
		msg.channel.send(`https://en.wikipedia.org/wiki/${encodeURI(page_data.title.split(' ').join('_'))}`);
	}
})
	.addExample('Cock and ball torture')
	.setDescription('looks up an article in Wikipedia')
	.setUsage('(string)')
	.setDisplayUsage('(artcle)')
	.setGlobalCooldown(500)
	.addAlias('wikipedia'));

cs.addCommand('wiki', new cs.Command('mcwiki', async msg => {
	const params = util.getParams(msg);
	let page_data = await wikimc.page(params.join(' '));

	if (page_data.wikitext < 0) {
		msg.channel.send('page not found!');
	} else {
		msg.channel.send(`https://minecraft.gamepedia.com/${encodeURI(page_data.title.split(' ').join('_'))}`);
	}
})
	.addExample('Bee')
	.setDescription('looks up an article in the minecraft gamepedia')
	.setUsage('(string)')
	.setDisplayUsage('(artcle)')
	.setGlobalCooldown(500));

cs.addCommand('wiki', new cs.Command('terrariawiki', async msg => {
	const params = util.getParams(msg);
	let page_data = await wikiterraria.page(params.join(' '));

	if (page_data.wikitext < 0) {
		msg.channel.send('page not found!');
	} else {
		msg.channel.send(`https://terraria.gamepedia.com/${encodeURI(page_data.title.split(' ').join('_'))}`);
	}
})
	.addExample('Slime')
	.setDescription('looks up an article in the terraria gamepedia')
	.setUsage('(string)')
	.setDisplayUsage('(artcle)')
	.setGlobalCooldown(500));

foxConsole.info('starting...');

bot.on('message', (msg) => {
	let content: string = msg.content;
	const author: Discord.User = msg.author;

	let thisPrefix: string = prefix;

	if (msg.guild) {
		if (guildSettings[msg.guild.id]) {
			thisPrefix = guildSettings[msg.guild.id].prefix;
			if (thisPrefix === undefined) {thisPrefix = prefix;}
		}
	}

	if (content.startsWith(thisPrefix) || content.startsWith(prefix)) {
		content = content.slice(content.startsWith(thisPrefix) ? thisPrefix.length : prefix.length, content.length);
		const cmd = content.split(' ')[0];

		foxConsole.debug('got command ' + cmd);

		Object.values(cs.commands).forEach((cat) => {
			Object.values(cat).forEach((command) => {
				if ((command['name'] === cmd || command['aliases'].includes(cmd))) {

					// check if user is blacklisted
					if (userData[msg.author.id] && userData[msg.author.id].blacklist) {
						let blacklist = userData[msg.author.id].blacklist;
						if (blacklist.includes(command.name) || blacklist.includes('.')) return;
					}
					
					if (((msg.content.startsWith(thisPrefix) || (msg.content.startsWith(prefix) && command['ignorePrefix'])) || (thisPrefix == prefix)) &&
						(!command['debugOnly'] || process.env.DEBUG == 'true')) {
						command['runCommand'](msg, bot);
					}
				}
			}); 
		});

		// debug and owneronly commands
		// not put into commandsystem for debugging if the system dies or something like that
		
		let clean = function(text) {
			if (typeof (text) === 'string') {
				text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
				return text;
			} else {
				return text;
			}
		};

		if (author.id === process.env.OWNER) {
			switch (cmd) {
			case 'eval':
			case 'debug':
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
			case 'reboot':
			case 'restart':
				if (pm2 !== null) {
					msg.react('🆗').then(() => {
						pm2.restart('boteline', () => {});
					});
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

bot.on('messageUpdate', (oldMsg, msg) => {
	if (msg.guild !== null && guildSettings[msg.guild.id] !== undefined && guildSettings[msg.guild.id].starboard !== undefined) {
		let starboardSettings = guildSettings[msg.guild.id].starboard;

		if (starboardBinds[msg.id]) {
			let embed = util.starboardEmbed(msg, starboardSettings, true);

			starboardBinds[msg.id].edit('', {embed: embed});
		}
	}
});

bot.on('messageDelete', (msg) => {
	if(msg.guild !== null && guildSettings[msg.guild.id] !== undefined && guildSettings[msg.guild.id].starboard !== undefined) {
		if (starboardBinds[msg.id]) {
			starboardBinds[msg.id].delete();
			delete starboardBinds[msg.id];
		}
	}
});

function handleReactions(reaction, user) {
	if (reaction.message.guild !== null && guildSettings[reaction.message.guild.id] !== undefined && guildSettings[reaction.message.guild.id].starboard !== undefined) {
		let starboardSettings = guildSettings[reaction.message.guild.id].starboard;

		if (starboardSettings.guildEmote) {
			if (starboardSettings.emote !== reaction.emoji.id) return;
		} else {
			if (starboardSettings.emote !== reaction.emoji.toString()) return;
		}

		if (user.id === reaction.message.author.id || user.bot) {
			reaction.remove(user);
			return;
		}

		if (reaction.count >= starboardSettings.starsNeeded) {
			let channel = reaction.message.guild.channels.find(ch => ch.id === starboardSettings.channel);

			if (channel) {
				let embed = util.starboardEmbed(reaction.message, starboardSettings, false, reaction);

				if(reaction.message.attachments) {
					let image = reaction.message.attachments.filter(at => at.width !== null).first();
					if (image) embed.setImage(image.url);
				}

				if (starboardBinds[reaction.message.id]) {
					starboardBinds[reaction.message.id].edit('', {embed: embed});
				} else {
					// @ts-ignore (you cant react to a message ...in a vc)
					channel.send('', {embed: embed})
						.then(m => {
							starboardBinds[reaction.message.id] = m;
						});
				}
			}
		} else if (starboardBinds[reaction.message.id]) {
			starboardBinds[reaction.message.id].delete();
			delete starboardBinds[reaction.message.id];
		}
	}
}

bot.on('messageReactionAdd', handleReactions);
bot.on('messageReactionRemove', handleReactions);

let firedReady = false;

bot.on('ready', () => {
	if (firedReady) {
		foxConsole.warning('ready event was fired twice');
		return;
	}

	foxConsole.info('fetching application...');
	bot.fetchApplication().then((app) => {
		application = app;
	});

	foxConsole.info('doing post-login intervals...');

	const presences: [string, Discord.ActivityType][] = [['Celeste', 'PLAYING'], ['Celeste OST', 'LISTENING'], ['you', 'WATCHING'], ['sleep', 'PLAYING'], [`try ${process.env.PREFIX}help`, 'PLAYING'], [`Boteline v${version}`, 'STREAMING']];

	bot.setInterval(() => {
		presences.push([`${bot.guilds.size} servers`, 'WATCHING']);
		presences.push([`with ${bot.users.size} users`, 'PLAYING']);

		const presence : [string, Discord.ActivityType] = presences[Math.floor(Math.random() * presences.length)];
		bot.user.setPresence({ status: 'dnd', game: { name: presence[0], type: presence[1] } });
	}, 30000);

	bot.setInterval(() => {
		foxConsole.debug('saving userdata & guild settings...');
		fs.writeFile('./data/userdata.json', JSON.stringify(userData), (err) => {
			if (err) {
				foxConsole.error('failed saving userdata: ' + err);
			}
		});

		fs.writeFile('./data/guildsettings.json', JSON.stringify(guildSettings), (err) => {
			if (err) {
				foxConsole.error('failed saving guildsettings: ' + err);
			}
		});
	}, 120000);

	cs.setClient(bot);

	foxConsole.success('ready!');
	firedReady = true;
	process.title = `Boteline v${version}`;
});

foxConsole.info('logging in...');
bot.login(process.env.TOKEN).then(() => {
	process.env.TOKEN = 'NTUxO_n1ceTryl0L-r9Pj8Y';
	foxConsole.info('patched out token');
});

// handle exiting the program (via ctrl+c, crash, etc)
// shamelessly stolen from https://stackoverflow.com/a/14032965
function exitHandler(options, exitCode : number) {
	if (options.cleanup) bot.destroy();
	if (exitCode || exitCode === 0) {
		foxConsole.info('Exiting with code ' + exitCode);
	}
	if (options.exit) process.exit();
}

// do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }));

// catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

// catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));