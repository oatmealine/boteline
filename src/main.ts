// libraries & modules
import * as Discord from 'discord.js';
const bot = new Discord.Client({
	disableMentions: 'everyone'
});

import * as CommandSystem from 'cumsystem';

import * as foxConsole from './lib/foxconsole';

import * as util from './lib/util.js';

import * as fs from 'fs';

import * as minesweeper from 'minesweeper';
import * as urban from 'urban';

import * as parse5 from 'parse5';

// modules
import * as cv from './commands/convert';
import * as md from './commands/moderation';
import * as sp from './commands/splatoon';
import * as gay from './commands/gay';
import * as translate from './commands/translate';
import * as wiki from './commands/wiki';
import * as video from './commands/video';
import * as info from './commands/info';
import * as color from './commands/color';
import * as weather from './commands/weather';
import * as booru from './commands/booru';
import * as debug from './commands/debug';
import * as coin from './commands/coin';

const ch = require('chalk');
const got = require('got');
// files

const packageJson = JSON.parse(fs.readFileSync('./package.json', {encoding: 'utf8'}));

const userData = JSON.parse(util.readIfExists('./data/userdata.json', {encoding: 'utf8'}, '{}'));
const guildSettings = JSON.parse(util.readIfExists('./data/guildsettings.json', {encoding: 'utf8'}, '{}'));

const valhallaDrinks = JSON.parse(fs.readFileSync('./src/valhalla.json', {encoding: 'utf8'}));

// .env stuff
require('dotenv').config();
foxConsole.showDebug(process.env.DEBUG == 'true');

// constants & variables
const prefix : string = process.env.PREFIX;

const version : string = packageJson.version + ' alpha';

let application: Discord.ClientApplication;

let starboardBinds = {};

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

const cs = new CommandSystem.System(bot, prefix);

cs.set('userData', userData);
cs.set('guildSettings', guildSettings);

cs.addCommand('core', new CommandSystem.SimpleCommand('invite', () => {
	return `Invite me here: <https://discordapp.com/oauth2/authorize?client_id=${application.id}&scope=bot&permissions=314432>`;
})
	.setDescription('get the bot\'s invite')
	.addAlias('invitelink'));

md.addCommands(cs);
cv.addCommands(cs);
sp.addCommands(cs);
gay.addCommands(cs);
translate.addCommands(cs);
wiki.addCommands(cs);
video.addCommands(cs);
info.addCommands(cs);
color.addCommands(cs);
weather.addCommands(cs);
booru.addCommands(cs);
debug.addCommands(cs);
coin.addCommands(cs);

cs.addCommand('utilities', new CommandSystem.Command('icon', (message) => {
	message.channel.send({ files: [{ attachment: message.guild.iconURL, name: 'icon.png' }] });
})
	.addAlias('servericon')
	.addAlias('serverpic')
	.setDescription('get the server\'s icon')
	.addClientPermission('ATTACH_FILES')
	.setGuildOnly());

cs.addCommand('utilities', new CommandSystem.Command('pfp', (msg) => {
	const params = util.getParams(msg);
	let user: Discord.User;

	if (params[0] !== undefined) {
		user = util.parseUser(bot, params[0], msg.guild);
	} else {
		user = msg.author;
	}
	msg.channel.send('', { files: [{ attachment: user.displayAvatarURL({dynamic: true}), name: 'avatar.png' }] });
})
	.setUsage('[user]')
	.addAlias('avatar')
	.setDescription('get a user\'s pfp')
	.addClientPermission('ATTACH_FILES'));

cs.addCommand('fun', new CommandSystem.SimpleCommand('kva', () => {
	return 'ква ква ква  гав гав гав    мяяяяяу   беееее  муууу  ку ку';
})
	.setHidden()
	.addAlias('ква')
	.setDescription('ква'));

cs.addCommand('fun', new CommandSystem.Command('eat', (msg) => {
	const params = util.getParams(msg);

	const eat = bot.emojis.cache.get('612360473928663040').toString();
	const hamger1 = bot.emojis.cache.get('612360474293567500').toString();
	const hamger2 = bot.emojis.cache.get('612360473987252278').toString();
	const hamger3 = bot.emojis.cache.get('612360473974931458').toString();

	const insideHamger: string = params[0] ? params.join(' ') : hamger2;

	msg.channel.send(eat + hamger1 + insideHamger + hamger3).then((m) => {
		if (m instanceof Discord.Message)
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

cs.addCommand('fun', new CommandSystem.Command('valhalla', (msg) => {
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
			if (editmsg instanceof Discord.Message)
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

cs.addCommand('fun', new CommandSystem.SimpleCommand('rate', (msg) => {
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

cs.addCommand('fun', new CommandSystem.SimpleCommand('pick', (msg) => {
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

cs.addCommand('fun', new CommandSystem.SimpleCommand('ask', (msg) => {
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

cs.addCommand('fun', new CommandSystem.Command('achievement', (msg) => {
	const params = util.getParams(msg);
	msg.channel.send('', { files: [{ attachment: 'https://minecraftskinstealer.com/achievement/1/Achievement+Get%21/' + encodeURI(params.join('+')), name: 'achievement.png' }] });
})
	.addAlias('advancement')
	.setDescription('make a minecraft achievement')
	.setUsage('(string)')
	.addExample('Made an example!')
	.addClientPermission('ATTACH_FILES'));

cs.addCommand('core', new CommandSystem.SimpleCommand('prefix', (msg) => {
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
	.addUserPermission('MANAGE_GUILD')
	.setGuildOnly());

cs.addCommand('fun', new CommandSystem.SimpleCommand('isgay', (msg) => {
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

cs.addCommand('moderating', new CommandSystem.Command('starboard', (msg : Discord.Message) => {
	let params = util.getParams(msg);

	let channel = msg.guild.channels.cache.find(c => c.id === params[0].replace('<#','').replace('>',''));
	if(!channel) {
		return msg.channel.send('channel doesnt exist!');
	} else {
		if(!channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES')) return msg.channel.send('i cant send messages there!');
		if(!channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) return msg.channel.send('i cant add embeds there!');
	}

	if (!params[2]) params[2] = '⭐';
	let emote = msg.guild.emojis.cache.find(em => em.id === params[2].slice(-19,-1));

	if (!guildSettings[msg.guild.id]) guildSettings[msg.guild.id] = {};

	if (params[1] !== '0') {
		guildSettings[msg.guild.id].starboard = {channel: channel.id, starsNeeded: Number(params[1]), emote: emote ? emote.id : params[2], guildEmote: emote !== undefined};

		let starSettings = guildSettings[msg.guild.id].starboard;
		return msg.channel.send(`gotcha! all messages with ${starSettings.starsNeeded} ${starSettings.guildEmote ? msg.guild.emojis.cache.get(starSettings.emote).toString() : starSettings.emote} reactions will be quoted in <#${starSettings.channel}>`);
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

cs.addCommand('fun', new CommandSystem.SimpleCommand('minesweeper', (msg) => {
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

cs.addCommand('utilities', new CommandSystem.Command('urban', msg => {
	const params = util.getParams(msg);
	let word = urban(params.join(' '));
	if (!params[0]) word = urban.random();

	word.first(json => {
		if (json) {
			if (json.example === '') {json.example = '(no example given)';}

			let embed = new Discord.MessageEmbed()
				.setTitle(json.word)
				.setURL(json.permalink)
				// the written_on thing is like that because of the date format being:
				// YYYY-mm-ddT00:00:00.000Z
				// note that the last time is always 0:00
				.setDescription(`written on ${json.written_on.slice(0, 10)} by ${json.author}\n${json.thumbs_up || '??'} :thumbsup: ${json.thumbs_down || '??'} :thumbsdown:`)
				.addField('Defintion', util.shortenStr(util.replaceUrbanLinks(json.definition), 1024), true)
				.addField('Example', util.shortenStr(util.replaceUrbanLinks(json.example), 1024), false);

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

cs.addCommand('fun', new CommandSystem.Command('inspirobot', msg => {
	msg.channel.startTyping();
	
	got('http://inspirobot.me/api?generate=true')
		.then(res => {
			if (res && res.statusCode == 200) {
				msg.channel.send({files: [res.body]}).then(() => {
					msg.channel.stopTyping();
				});
			}
		});
})
	.addClientPermission('ATTACH_FILES')
	.setGlobalCooldown(1000)
	.setDescription('fetch an inspiring ai-generated quote from [inspirobot](http://inspirobot.me/)')
	.addAlias('insp'));

cs.addCommand('moderating', new CommandSystem.SimpleCommand('blacklistuser', msg => {
	const params = util.getParams(msg);
	let blacklistcmds = [];

	if (params[0] === process.env.OWNER) return 'you can\'t blacklist the owner!';
	if (params[1]) blacklistcmds = params.slice(1);
	if (!userData[params[0]]) userData[params[0]] = {};

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

cs.addCommand('fun', new CommandSystem.Command('hi', msg => {
	msg.channel.send('', {files: ['assets/hi.png']});
})
	.setDescription('hi')
	.setHidden());


cs.addCommand('utilities', new CommandSystem.Command('mcping', (msg) => {
	const params = util.getParams(msg);
	msg.channel.startTyping();
	
	require('minecraft-server-util')(params[0], params[1])
		.then(res => {
			msg.channel.stopTyping();

			const embed = new Discord.MessageEmbed()
				.setTitle(res.host + ':' + res.port)
				.setDescription(util.formatMinecraftCode(res.descriptionText))
				.addField('Version', `${res.version} (protocol version: ${res.protocolVersion})`, true);
			
			if (res.samplePlayers !== null && res.samplePlayers.length > 0) {
				embed.addField(`Players - ${res.onlinePlayers}/${res.maxPlayers}`, 
					util.shortenStr(
						res.samplePlayers.map(pl => `- ${pl.name}`)
							.join('\n'), 1024)
				);
			} else {
				embed.setDescription(embed.description + `\n${res.onlinePlayers}/${res.maxPlayers} online`);
			}

			if (res.modList !== null && res.modList.length > 0) {
				embed.addField('Mods', util.shortenStr(
					res.modList.map(mod => `- ${mod.modid} v${mod.version}`)
						.join('\n'), 1024)
				);
			}
			
			msg.channel.send(embed);
		})
		.catch(err => {
			msg.channel.stopTyping();

			msg.channel.send(err.toString());
		});
}));

cs.addCommand('core', new CommandSystem.Command('latencymeasure', async (msg) => {
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
	.setGlobalCooldown(10000)
	.setDescription('measure the latency of the discord api')
	.addClientPermission('EMBED_LINKS')
	.addAlias('fancyping'));

cs.addCommand('fun', new CommandSystem.Command('robloxad', async (msg) => {
	let url = 'https://www.roblox.com/user-sponsorship/' + (Math.floor(Math.random() * 3) + 1);
	let document = await got(url);

	let parsedDocument = parse5.parse(document.body);

	// @ts-ignore
	let attrs = parsedDocument.childNodes[1].childNodes[2].childNodes[1].childNodes[1].attrs;
	// @ts-ignore
	let link = parsedDocument.childNodes[1].childNodes[2].childNodes[1].attrs[2].value;

	let embed = new Discord.MessageEmbed()
		.setTitle(attrs[1].value)
		.setURL(link)
		.setImage(attrs[0].value)
		.setDescription(`ads fetched from [here](${url})`);

	return msg.channel.send(embed);
})
	.setDescription('fetch a roblox ad')
	.addClientPermissions(['EMBED_LINKS', 'ATTACH_FILES'])
	.setGlobalCooldown(300));

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

	if (!content.startsWith(thisPrefix) && !content.startsWith(prefix)) return;

	if (content.startsWith(thisPrefix)) content = content.slice(thisPrefix.length);
	if (content.startsWith(prefix)) content = content.slice(prefix.length);

	let cmd = content.split(' ')[0];

	foxConsole.debug('got command ' + cmd);

	// check if user is blacklisted
	if (userData[msg.author.id] && userData[msg.author.id].blacklist) {
		let blacklist = userData[msg.author.id].blacklist;
		if (blacklist.includes(cmd) || blacklist.includes('.')) return;
	}

	// @ts-ignore
	cs.parseMessage(msg, thisPrefix);

	// debug and owneronly commands
	// not put into commandsystem for debugging if the system dies or something like that
		
	if (author.id === process.env.OWNER) {
		switch (cmd) {
		case 'eval':
		case 'debug':
		case 'seval':
		case 'sdebug':

			break;
		case 'reboot':
		case 'restart':
			
			break;
		case 'exec':
		case 'sexec':
			
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
			let channel = reaction.message.guild.channels.cache.find(ch => ch.id === starboardSettings.channel);

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
		presences.push([`${bot.guilds.cache.size} servers`, 'WATCHING']);
		presences.push([`with ${bot.users.cache.size} users`, 'PLAYING']);

		const presence : [string, Discord.ActivityType] = presences[Math.floor(Math.random() * presences.length)];
		bot.user.setPresence({status: 'dnd', activity: {name: presence[0], type: presence[1]}});
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

	// update boteline coin stuff
	cs.setClient(bot);

	foxConsole.success('ready!');
	firedReady = true;
	process.title = `Boteline v${version}`;
});

cs.on('error', (err, msg, cmd) => {
	console.log(`error in ${cmd.name}:`);
	console.error(err);

	msg.channel.send(`Got error while running command: \`${err}\``);
});

foxConsole.info('logging in...');
bot.login(process.env.TOKEN).then(() => {
	process.env.TOKEN = 'NTUxO_n1ceTryl0L-r9Pj8Y';
	foxConsole.info('patched out token');
});