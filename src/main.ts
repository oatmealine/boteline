// libraries & modules
import * as Discord from 'discord.js';
const bot = new Discord.Client({
	disableMentions: 'everyone'
});

import * as CommandSystem from 'cumsystem';
import * as util from './lib/util.js';
import * as format from './lib/format';
import * as fs from 'fs';
import * as winston from 'winston';

// modules
import * as commands from './commands';

const ch = require('chalk');
// files

const packageJson = JSON.parse(fs.readFileSync('./package.json', {encoding: 'utf8'}));

const userData = JSON.parse(util.readIfExists('./data/userdata.json', {encoding: 'utf8'}, '{}'));
const guildSettings = JSON.parse(util.readIfExists('./data/guildsettings.json', {encoding: 'utf8'}, '{}'));

// .env stuff
require('dotenv').config();

// logger

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.printf(log => `${format.formatTime(new Date(log.timestamp))} | ${log.message}`)
	),
	transports: [
		new winston.transports.File({filename: 'boteline-error.log', level: 'error'}),
		new winston.transports.File({filename: 'boteline.log'}),
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.timestamp(),
				winston.format.printf(log => 
					`${format.formatTime(new Date(log.timestamp))} - [${log.level}] ${log.message}`
				)
			),
			level: process.env.DEBUG === 'true' ? 'silly' : 'info'
		})
	]
});

// constants & variables
const prefix : string = process.env.PREFIX;

const version : string = packageJson.version + ' alpha';

logger.info(ch.red.bold(`boteline v${version}`));
if (process.env.DEBUG) { logger.debug(ch.grey('debug printing on')); }

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
logger.info('adding commands...');

const cs = new CommandSystem.System(bot, prefix);

cs.set('userData', userData);
cs.set('guildSettings', guildSettings);
cs.set('logger', logger);

commands.addCommands(cs);

logger.info('starting...');

bot.on('message', (msg) => {
	let content: string = msg.content;

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

	logger.debug('got command ' + cmd);

	// check if user is blacklisted
	if (userData[msg.author.id] && userData[msg.author.id].blacklist) {
		let blacklist = userData[msg.author.id].blacklist;
		if (blacklist.includes(cmd) || blacklist.includes('.')) return;
	}

	cs.parseMessage(msg, thisPrefix);
});


let firedReady = false;

bot.on('ready', () => {
	if (firedReady) {
		logger.warn('ready event was fired twice');
		return;
	}

	logger.info('doing post-login intervals...');

	const presences: [string, Discord.ActivityType][] = [['Celeste', 'PLAYING'], ['Celeste OST', 'LISTENING'], ['you', 'WATCHING'], ['sleep', 'PLAYING'], [`try ${process.env.PREFIX}help`, 'PLAYING'], [`Boteline v${version}`, 'STREAMING']];

	bot.setInterval(() => {
		presences.push([`${bot.guilds.cache.size} servers`, 'WATCHING']);
		presences.push([`with ${bot.users.cache.size} users`, 'PLAYING']);

		const presence : [string, Discord.ActivityType] = presences[Math.floor(Math.random() * presences.length)];
		bot.user.setPresence({status: 'dnd', activity: {name: presence[0], type: presence[1]}});
	}, 30000);

	bot.setInterval(() => {
		logger.debug('saving userdata & guild settings...');
		fs.writeFile('./data/userdata.json', JSON.stringify(userData), (err) => {
			if (err) {
				logger.error('failed saving userdata: ' + err);
			}
		});

		fs.writeFile('./data/guildsettings.json', JSON.stringify(guildSettings), (err) => {
			if (err) {
				logger.error('failed saving guildsettings: ' + err);
			}
		});
	}, 120000);

	// update boteline coin stuff
	cs.setClient(bot);

	logger.info('ready!');
	firedReady = true;
	process.title = `Boteline v${version}`;
});

cs.on('error', (err, msg, cmd) => {
	logger.error(`error in ${cmd.name}:`);
	logger.error(err.stack);

	msg.channel.send(`Got error while running command: \`${err}\``);
});

logger.info('logging in...');
bot.login(process.env.TOKEN).then(() => {
	process.env.TOKEN = 'NTUxO_n1ceTryl0L-r9Pj8Y';
	logger.info('patched out token');
});