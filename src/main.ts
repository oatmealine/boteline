// the bot name !
const botName = 'Boteline';
const botNameCode = botName.toLowerCase().split(' ').join('');

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

// events
import * as message from './events/message';
import * as ready from './events/ready';
import { exec } from 'child_process';

const ch = require('chalk');
// files

const packageJson = JSON.parse(fs.readFileSync('./package.json', {encoding: 'utf8'}));
const packageJsonLock = JSON.parse(fs.readFileSync('./package-lock.json', {encoding: 'utf8'}));

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

let commit;
exec('git rev-parse HEAD', (err, stdout) => {
	if (err) return logger.error('something went wrong while fetching commit! is git in path?: ' + err);
	stdout = stdout.split('\n').join('');
	logger.info(`commit ${stdout}`);
	commit = stdout;
	return cs.set('commit', commit);
});

const brandColor = '#f16260'; // i hate referring to boteline as a brand but i guess it kind of is a brand
// this will be used for lots of embeds

logger.info(ch.red.bold(`${botName} v${version}`));
if (process.env.DEBUG) { logger.debug(ch.grey('debug printing on')); }

process.title = `Starting ${botName} v${version}`;

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
cs.set('version', version);
cs.set('brandColor', brandColor);
cs.set('botName', botName);
cs.set('botNameCode', botNameCode);
cs.set('packageJson', packageJson);
cs.set('packageJsonLock', packageJsonLock);

cs.set('userAgent', `${botName} v${version} ${packageJson.repository}`);

commands.addCommands(cs);

logger.info('starting...');

bot.on('message', (msg) => {
	message.run(msg, cs);
});

bot.on('ready', () => {
	ready.run(cs);
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