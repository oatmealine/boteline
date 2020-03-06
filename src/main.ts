// libraries & modules
import * as Discord from 'discord.js';
const bot = new Discord.Client({
	disableMentions: 'everyone'
});

import * as CommandSystem from 'cumsystem';

import * as foxConsole from './lib/foxconsole';

import * as util from './lib/util.js';

import {exec} from 'child_process';
import * as fs from 'fs';

import * as minesweeper from 'minesweeper';
import * as urban from 'urban';
import * as rq from 'request';

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

// hardcoded, but cant do anything about it
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

const userData = JSON.parse(util.readIfExists('./data/userdata.json', {encoding: 'utf8'}, '{}'));
const guildSettings = JSON.parse(util.readIfExists('./data/guildsettings.json', {encoding: 'utf8'}, '{}'));
const coinValue = JSON.parse(util.readIfExists('./data/coinvalue.json', { encoding: 'utf8' }, '{"value": 3, "direction": "up", "strength": 0.2, "speed": 2, "remaining": 4, "pastvalues": []}'));
const schlattCoinValue = JSON.parse(util.readIfExists('./data/schlattcoinvalue.json', { encoding: 'utf8' }, '{"value": 3, "direction": "up", "strength": 0.2, "speed": 2, "remaining": 4, "pastvalues": []}'));

const valhallaDrinks = JSON.parse(fs.readFileSync('./src/valhalla.json', {encoding: 'utf8'}));

// .env stuff
require('dotenv').config();
foxConsole.showDebug(process.env.DEBUG == 'true');

// constants & variables
const prefix : string = process.env.PREFIX;

const version : string = packageJson.version + ' alpha';

let application: Discord.ClientApplication;

let starboardBinds = {};

let lastCoinUpdateDate = Date.now();

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

function updateCoins(save = true) {
	foxConsole.info('updating coin values');

	lastCoinUpdateDate = Date.now();

	/*
		 sample coin data:
		 {
			 "value": 3,
			 "direction": "up",
			 "strength": 0.25,
			 "speed": 0.2
			 "remaining": 4,
			 "pastvalues": [],
			 "weirdCrashing": false
		 }

		 value is the value of the coin in USD
		 direction is where the chart is currently moving, a string equal to either 'up' or 'down'
		 strength is a value from 0 to 1 determening how likely the chart is to go in the opposite direction each update
		 speed is by how much the value will increase each update
		 remaining is how much guaranteed updates are left before the graph switches direction
		 pastvalues is an array of the past 10 values
		 weirdcrashing is a schlattcoin-only value that determines if the value is crashing in a fucked-up way
		*/

	// boteline coins
	coinValue.pastvalues.push(coinValue.value);
	if (coinValue.pastvalues.length > 40) {
		coinValue.pastvalues.shift();
	} else {
		updateCoins(false);
	}

	let oppositeDir = (dir) => {
		if (dir === 'up') return 'down';
		return 'up';
	};

	let direction = Math.random() < coinValue.strength ? oppositeDir(coinValue.direction) : coinValue.direction; // if the strength is low enough, the higher the chance itll go the opposite direction
		
	let speed = coinValue.speed;
	if (direction !== coinValue.direction) // randomize the speed if its going in an incorrect way
		speed = Math.random() * 3 + 1;

	let increaseAmount = speed * (direction === 'up' ? 1 : -1); // the final calculated amount to increase the coin by

	coinValue.value += increaseAmount;
	coinValue.remaining--;

	if (coinValue.remaining <= 0) {
		coinValue.remaining = Math.ceil(Math.random() * 4);
		coinValue.direction = Math.random() >= 0.5 ? 'up' : 'down';
		coinValue.speed = Math.random() * 23 + 10;
		coinValue.strength = Math.random() * 0.3 + 0.1;
	}

	if (Math.random() > 0.998) { // the economy has a really rare chance of crashing! :o
		schlattCoinValue.direction = 'down';
		schlattCoinValue.remaining = 4;
		schlattCoinValue.strength = 0.2;
		schlattCoinValue.speed = Math.random() * 8 + 30;
	}

	if (Math.random() > 0.999) { // and a really rare chance of rising to heck
		schlattCoinValue.direction = 'up';
		schlattCoinValue.remaining = 3;
		schlattCoinValue.strength = 0.2;
		schlattCoinValue.speed = Math.random() * 7 + 30;
	}

	if (coinValue.value < 0) { // just incase this ever DOES happen
		coinValue.value = Math.abs(coinValue.value);
		coinValue.remaining = 2;
		coinValue.direction = 'up';
	}
	
	if (coinValue.value > 20000) // i hope this never happens but i mean you never know
		coinValue.direction = 'down';

	// schlatt coins
	schlattCoinValue.pastvalues.push(schlattCoinValue.value);
	if (schlattCoinValue.pastvalues.length > 40) {
		schlattCoinValue.pastvalues.shift();
	} else {
		updateCoins(false);
	}

	direction = Math.random() < schlattCoinValue.strength ? oppositeDir(schlattCoinValue.direction) : schlattCoinValue.direction; // if the strength is low enough, the higher the chance itll go the opposite direction

	speed = schlattCoinValue.speed;
	if (direction !== schlattCoinValue.direction) // randomize the speed if its going in an incorrect way
		speed = Math.random() * 30 + 10;

	increaseAmount = speed * (direction === 'up' ? 1 : -1); // the final calculated amount to increase the coin by

	schlattCoinValue.value += increaseAmount;
	schlattCoinValue.remaining--;

	if (schlattCoinValue.remaining <= 0 && !schlattCoinValue.weirdCrashing) {
		schlattCoinValue.remaining = Math.ceil(Math.random() * 5) + 1;
		schlattCoinValue.direction = Math.random() >= 0.55 ? 'up' : 'down';
		schlattCoinValue.speed = Math.random() * 30 + 12;
		schlattCoinValue.strength = Math.random() * 0.6 + 0.2;
	}

	if (Math.random() > 0.96) { // the economy has a really rare chance of crashing! :o
		schlattCoinValue.direction = 'down';
		schlattCoinValue.remaining = 5;
		schlattCoinValue.strength = 0.1;
		schlattCoinValue.speed = Math.random() * 50 + 60;
	}

	if (Math.random() > 0.99) { // and a really rare chance of rising to heck
		schlattCoinValue.direction = 'up';
		schlattCoinValue.remaining = 2;
		schlattCoinValue.strength = 0.1;
		schlattCoinValue.speed = Math.random() * 30 + 30;
	}

	if (schlattCoinValue.value > 400 && Math.random() > 0.99) {
		schlattCoinValue.weirdCrashing = true;
		schlattCoinValue.remaining = Math.round(Math.random()) + 1;
	}

	if (schlattCoinValue.weirdCrashing) {
		schlattCoinValue.speed = schlattCoinValue.value / 2 + 10;
		schlattCoinValue.strength = 0;
		schlattCoinValue.direction = 'down';

		if (schlattCoinValue.value < 5 || schlattCoinValue.remaining <= 0) schlattCoinValue.weirdCrashing = false;
	}

	if (schlattCoinValue.value < 0) { // just incase this ever DOES happen
		schlattCoinValue.value = Math.abs(schlattCoinValue.value);
	}

	if (schlattCoinValue.value > 30000) // i hope this never happens but i mean you never know
		schlattCoinValue.direction = 'down';

	schlattCoinValue.value = util.roundNumber(schlattCoinValue.value, 5);
	coinValue.value = util.roundNumber(coinValue.value, 5);

	Object.values(guildSettings).forEach((v : any) => {
		if (v.watchChannel && bot.channels.cache.get(v.watchChannel)) {
			let channel = bot.channels.cache.get(v.watchChannel);
			if (channel instanceof Discord.TextChannel) {
				cs.commands.coin.cchart.cfunc(new Discord.Message( // janky solution but it should work
					bot,
					{
						content: prefix + 'cchart',
						author: bot.user,
						embeds: [],
						attachments: new Discord.Collection(),
						createdTimestamp: 0,
						editedTimestamp: 0
					},
					channel
				), bot);
			}
		}
	});

	if (save) {
		fs.writeFile('./data/coinvalue.json', JSON.stringify(coinValue), (err) => {
			if (err) {
				foxConsole.error('failed saving coinvalue: ' + err);
			}
		});
		fs.writeFile('./data/schlattcoinvalue.json', JSON.stringify(schlattCoinValue), (err) => {
			if (err) {
				foxConsole.error('failed saving coinvalue: ' + err);
			}
		});
	}
}

const cs = new CommandSystem.System(bot, prefix);

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

// economy stuff
cs.addCommand('coin', new CommandSystem.SimpleCommand('cinit', msg => {
	if (!userData[msg.author.id]) userData[msg.author.id] = {};

	userData[msg.author.id].invest = {
		balance: 100,
		invested: 0, // how much the user has invested
		investstartval: 0, // how much coins were worth back then
		investeds: 0, // schlattcoin
		investstartvals: 0
	};

	return 'created/reset an account for you!';
})
	.setDescription('create an account for boteline coin commands'));

cs.addCommand('coin', new CommandSystem.SimpleCommand('cbal', msg => {
	if (!userData[msg.author.id] || !userData[msg.author.id].invest) return 'you dont have an account! create a new one with `cinit`';
	let user = userData[msg.author.id].invest;
	let returnstring = '';

	returnstring += `Your balance is: ${util.roundNumber(user.balance, 3)}$ (= ${util.roundNumber(user.balance / coinValue.value, 2)}BC = ${util.roundNumber(user.balance / schlattCoinValue.value, 2)}SC)\n`;
	if (user.invested === 0) {
		returnstring += 'You don\'t have any boteline coins!\n';
	} else {
		returnstring += `You have ${util.roundNumber(user.invested, 4)}BC (= ${util.roundNumber(user.invested * coinValue.value, 2)}$)\n`;
		let profit = util.roundNumber((coinValue.value - user.investstartval) / user.investstartval * 100, 2);
		let profitusd = util.roundNumber((coinValue.value - user.investstartval) * user.invested, 2);

		returnstring += `The value has gone up by ${profit}% since you last bought BC (profited ${profitusd}$)\n`;
	}

	if (user.investeds === 0 || !user.investeds) {
		returnstring += 'You don\'t have any schlattcoin!\n';
	} else {
		returnstring += `You have ${util.roundNumber(user.investeds, 4)}SC (= ${util.roundNumber(user.investeds * schlattCoinValue.value, 2)}$)\n`;
		let profit = util.roundNumber((schlattCoinValue.value - user.investstartvals) / user.investstartvals * 100, 2);
		let profitusd = util.roundNumber((schlattCoinValue.value - user.investstartvals) * user.investeds, 2);

		returnstring += `The value has gone up by ${profit}% since you last bought SC (profited ${profitusd}$)\n`;
	}

	return returnstring;
})
	.setDescription('check your balance'));

cs.addCommand('coin', new CommandSystem.SimpleCommand('cval', () => {
	let chartem = coinValue.value < coinValue.pastvalues[coinValue.pastvalues.length - 1] ? ':chart_with_downwards_trend:' : ':chart_with_upwards_trend:';
	let chartemsch = schlattCoinValue.value < schlattCoinValue.pastvalues[schlattCoinValue.pastvalues.length - 1] ? ':chart_with_downwards_trend:' : ':chart_with_upwards_trend:';
	return `1BC is currently worth ${util.roundNumber(coinValue.value, 2)}$ ${chartem}
1SC is currently worth ${util.roundNumber(schlattCoinValue.value, 2)}$ ${chartemsch}
(boteline coins/schlattcoin are not a real currency/cryptocurrency!)
The values should be updated in ${util.roundNumber((110000 - (Date.now() - lastCoinUpdateDate)) / 1000, 1)}s`;
})
	.setDescription('check the coin values'));

cs.addCommand('coin', new CommandSystem.SimpleCommand('cbuy', msg => {
	if (!userData[msg.author.id] || !userData[msg.author.id].invest) return 'you dont have an account! create a new one with `cinit`';
	let user = userData[msg.author.id].invest;
	const params = util.getParams(msg);
	let invmoney = Number(params[0]) * coinValue.value;

	if (user.balance <= 0) return 'you have no money in your account! create a new one with `cinit` (bankrupt fuck)';
	if (params[0] === 'all') {
		params[0] = String(user.balance);
		invmoney = user.balance;
	}
	if (Number(params[0]) != Number(params[0].replace('$', ''))) {
		params[0] = params[0].replace('$', '');
		invmoney = Number(params[0]);
	}
	if (isNaN(Number(params[0])) && isNaN(invmoney)) return 'that isn\'t a number!';
	if (user.balance < invmoney) return 'you dont have enough money in your account!';
	if (invmoney <= 0) return 'you cant buy that little!';

	userData[msg.author.id].invest.balance = user.balance - invmoney;
	userData[msg.author.id].invest.invested = user.invested + invmoney / coinValue.value;
	userData[msg.author.id].invest.investstartval = coinValue.value;

	return `bought ${util.roundNumber(invmoney / coinValue.value, 2)}BC (${util.roundNumber(invmoney, 2)}$)`;
})
	.setDescription('buy an amount of boteline coins, use `all` to buy as many as possible')
	.setUsage('(string)')
	.setDisplayUsage('(coin amount, or dollars)')
	.addAlias('cinv'));

cs.addCommand('coin', new CommandSystem.SimpleCommand('csell', msg => {
	if (!userData[msg.author.id] || !userData[msg.author.id].invest) return 'you dont have an account! create a new one with `cinit`';
	const params = util.getParams(msg);
	let user = userData[msg.author.id].invest;

	if (user.invested === 0) return 'you havent bought any coins yet!';
	if (params[0] === 'all') params[0] = String(user.invested);
	if (isNaN(Number(params[0]))) return 'that isn\'t a number!';
	if (Number(params[0]) > user.invested) return 'you dont have that much coins!';
	if (Number(params[0]) <= 0) return 'you can\'t sell that little!';
	
	let profit = Number(params[0]) * coinValue.value;

	userData[msg.author.id].invest.balance = user.balance + profit;
	userData[msg.author.id].invest.invested = user.invested - Number(params[0]);

	return `you sold ${params[0]}bc for ${util.roundNumber(profit, 2)}$! your balance is now ${util.roundNumber(userData[msg.author.id].invest.balance, 2)}$`;
})
	.setDescription('sell your boteline coins, use `all` to sell every single one you have')
	.setUsage('(string)')
	.setDisplayUsage('(coins)'));

cs.addCommand('coin', new CommandSystem.SimpleCommand('cbuys', msg => {
	if (!userData[msg.author.id] || !userData[msg.author.id].invest) return 'you dont have an account! create a new one with `cinit`';
	let user = userData[msg.author.id].invest;
	const params = util.getParams(msg);
	let invmoney = Number(params[0]) * schlattCoinValue.value;

	if (user.balance <= 0) return 'you have no money in your account! create a new one with `cinit` (bankrupt fuck)';
	if (params[0] === 'all') {
		params[0] = String(user.balance);
		invmoney = user.balance;
	}
	if (Number(params[0]) != Number(params[0].replace('$', ''))) {
		params[0] = params[0].replace('$', '');
		invmoney = Number(params[0]);
	}
	if (Number(params[0]) != Number(params[0].replace('%', ''))) {
		params[0] = params[0].replace('%', '');
		invmoney = Number(params[0])/100 * user.balance;
	}
	if (isNaN(Number(params[0])) && isNaN(invmoney)) return 'that isn\'t a number!';
	if (user.balance < invmoney) return 'you dont have enough money in your account!';
	if (invmoney <= 0) return 'you cant buy that little!';

	userData[msg.author.id].invest.balance = user.balance - invmoney;
	userData[msg.author.id].invest.investeds = user.investeds + invmoney / schlattCoinValue.value;
	userData[msg.author.id].invest.investstartvals = schlattCoinValue.value;

	return `bought ${util.roundNumber(invmoney / schlattCoinValue.value, 2)}SC (${util.roundNumber(invmoney, 2)}$)`;
})
	.setDescription('buy an amount of schlattcoin, use `all` to buy as many as possible')
	.setUsage('(string)')
	.setDisplayUsage('(coin amount, percentage, or dollars)')
	.addAlias('cinv'));

cs.addCommand('coin', new CommandSystem.SimpleCommand('csells', msg => {
	if (!userData[msg.author.id] || !userData[msg.author.id].invest) return 'you dont have an account! create a new one with `cinit`';
	const params = util.getParams(msg);
	let user = userData[msg.author.id].invest;

	if (user.investeds === 0) return 'you havent bought any coins yet!';
	if (params[0] === 'all') params[0] = String(user.investeds);
	if (isNaN(Number(params[0]))) return 'that isn\'t a number!';
	if (Number(params[0]) > user.investeds) return 'you dont have that much coins!';
	if (Number(params[0]) <= 0) return 'you can\'t sell that little!';

	let profit = Number(params[0]) * schlattCoinValue.value;

	userData[msg.author.id].invest.balance = user.balance + profit;
	userData[msg.author.id].invest.investeds = user.investeds - Number(params[0]);

	return `you sold ${params[0]}SC for ${util.roundNumber(profit, 2)}$! your balance is now ${util.roundNumber(userData[msg.author.id].invest.balance, 2)}$`;
})
	.setDescription('sell your schlattcoin, use `all` to sell every single one you have')
	.setUsage('(string)')
	.setDisplayUsage('(coins)'));

cs.addCommand('coin', new CommandSystem.Command('cchart', msg => {
	msg.channel.startTyping();
	
	let bcchartdata = {
		type: 'line',
		data: {
			labels: Array(coinValue.pastvalues.length + 1).fill(''),
			datasets: [
				{
					label: 'Boteline Coins',
					data: coinValue.pastvalues.concat([coinValue.value]),
					fill: false,
					borderColor: 'red',
					borderWidth: 3,
					pointRadius: 0
				},
				{
					label: 'Schlattcoin',
					data: schlattCoinValue.pastvalues.concat([schlattCoinValue.value]),
					fill: false,
					borderColor: 'blue',
					borderWidth: 3,
					pointRadius: 0
				}
			]
		},
		options: {
			title: {
				display: true,
				text: 'Coin Values',
				fontColor: 'black',
				fontSize: 32
			},
			legend: {
				position: 'bottom'
			}
		}
	};

	msg.channel.send({
		files: [{
			attachment: 'https://quickchart.io/chart?bkg=white&c='+encodeURI(JSON.stringify(bcchartdata)),
			name: 'look-at-this-graph.png'
		}]
	}).then(m => {if (m instanceof Discord.Message) m.channel.stopTyping();});
})
	.setDescription('view coin history via a chart')
	.addClientPermission('ATTACH_FILES')
	.setGlobalCooldown(1500));

cs.addCommand('coin', new CommandSystem.Command('ctop', msg => {
	let leaderboard = Object.keys(userData)
		.filter(a => userData[a].invest)
		.sort(
			(a, b) =>
				userData[b].invest.balance -
      	userData[a].invest.balance
		)
		.slice(0, 9)
		.map((u,i) =>
			`${i + 1}. ${bot.users.cache.get(u) || '???'} - ${util.roundNumber(userData[u].invest.balance, 2)}$`
		)
		.join('\n');

	let embed = new Discord.MessageEmbed()
		.setTitle('rich leaderboards')
		.setFooter('rich fucks')
		.setColor('FFFF00')
		.setDescription(leaderboard);

	msg.channel.send(embed);
}));

cs.addCommand('coin', new CommandSystem.SimpleCommand('cwatch', msg => {
	if (!guildSettings[msg.guild.id]) guildSettings[msg.guild.id] = {};

	guildSettings[msg.guild.id].watchChannel = msg.channel.id;
	
	return 'done, will now log all updates here';
})
	.setDescription('send all updates to the current channel, use unwatch to stop')
	.setGlobalCooldown(5000)
	.addUserPermission('MANAGE_CHANNELS')
	.setGuildOnly());

cs.addCommand('coin', new CommandSystem.SimpleCommand('cunwatch', msg => {
	if (!guildSettings[msg.guild.id]) guildSettings[msg.guild.id] = {};

	delete guildSettings[msg.guild.id].watchChannel;

	return 'done, will now stop loging all updates';
})
	.setDescription('stop sending all updates to this guild\'s update channel')
	.setGlobalCooldown(2000)
	.addUserPermission('MANAGE_CHANNELS')
	.setGuildOnly());

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
	const testingMessage: Discord.Message = await msg.channel.send('Measuring... 1/4');

	const sendMessageDelay = Date.now() - testingMessageSentAt;
	
	let messageEditedAt = Date.now();
	await testingMessage.edit('Measuring... 2/4');

	const editMessageDelay = Date.now() - messageEditedAt;

	let messageReactedAt = Date.now();
	testingMessage.edit('Measuring... 3/4');
	await testingMessage.react('📶');

	const reactMessageDelay = Date.now() - messageReactedAt;

	let messageDeletedAt = Date.now();
	await testingMessage.delete();

	const deleteMessageDelay = Date.now() - messageDeletedAt;

	const averageDelay = util.roundNumber((sendMessageDelay + editMessageDelay + deleteMessageDelay + reactMessageDelay) / 4, 2);

	// send result back
	const embed = new Discord.MessageEmbed()
		.setTitle('Discord Latency Measure')
		.addField('`SEND_MESSAGE`', `${sendMessageDelay}ms of delay`)
		.addField('`EDIT_MESSAGE`', `${editMessageDelay}ms of delay`)
		.addField('`DELETE_MESSAGE`', `${deleteMessageDelay}ms of delay`)
		.addField('`MESSAGE_REACT`', `${reactMessageDelay}ms of delay`)
		.setDescription(`The average delay is ${averageDelay}ms`);

	msg.channel.send(embed);
})
	.setGlobalCooldown(10000)
	.setDescription('measure the latency of the discord api')
	.addClientPermission('EMBED_LINKS')
	.addAlias('fancyping'));

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
	let cmd = content.split(' ')[0];

	if (cmd.startsWith(thisPrefix)) cmd = cmd.slice(thisPrefix.length);
	if (cmd.startsWith(prefix)) cmd = cmd.slice(prefix.length);

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
		case 'seval':
		case 'sdebug':
			try {
				const code = content.replace(cmd + ' ', '');
				let evaled = eval(code);

				if (typeof evaled !== 'string') {
					evaled = require('util').inspect(evaled, {depth: 1, maxArrayLength: null});
				}

				const embed = {
					title: 'Eval',
					color: '990000',
					fields: [{
						name: 'Input',
						value: '```xl\n' + util.shortenStr(code, 1000) + '\n```',
						inline: true,
					},
					{
						name: 'Output',
						value: '```xl\n' + util.shortenStr(clean(evaled), 1000) + '\n```',
						inline: true,
					},
					],
				};

				if (!msg.content.startsWith(prefix + 's')) msg.channel.send('', { embed });
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
		case 'sexec':
			exec(content.replace(cmd + ' ', ''), (err, stdout) => {
				if (err) {
					if (!msg.content.startsWith(prefix + 's')) msg.channel.send('```' + err + '```');
					msg.react('❌');
				} else {
					if (!msg.content.startsWith(prefix + 's')) msg.channel.send('```' + stdout + '```');
					msg.react('☑');
				}
			});
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
	bot.setInterval(updateCoins, 110000);

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
function exitHandler(options, exitCode) {
	if (options.cleanup) bot.destroy();
	if (exitCode || exitCode === 0) {
		if (exitCode instanceof Error) console.log(exitCode);
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
