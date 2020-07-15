import * as Discord from 'discord.js';
import { System } from 'cumsystem';
import * as fs from 'fs';

Discord; System; // ts go brrrrrrr

let firedReady = false;

export function run(cs: System) {
	let logger = cs.get('logger');
	let bot = cs.client;

	if (firedReady) {
		logger.warn('ready event was fired twice');
		return;
	}

	logger.info('doing post-login intervals...');

	const presences: [string, Discord.ActivityType][] = [['Celeste', 'PLAYING'], ['Celeste OST', 'LISTENING'], ['you', 'WATCHING'], ['sleep', 'PLAYING'], [`try ${process.env.PREFIX}help`, 'PLAYING'], [`${cs.get('botName')} v${cs.get('version')}`, 'STREAMING']];

	bot.setInterval(() => {
		presences.push([`${bot.guilds.cache.size} servers`, 'WATCHING']);
		presences.push([`with ${bot.users.cache.size} users`, 'PLAYING']);

		const presence : [string, Discord.ActivityType] = presences[Math.floor(Math.random() * presences.length)];
		bot.user.setPresence({status: 'dnd', activity: {name: presence[0], type: presence[1]}});
	}, 30000);

	bot.setInterval(() => {
		logger.debug('saving userdata & guild settings...');
		fs.writeFile('./data/userdata.json', JSON.stringify(cs.get('userData')), (err) => {
			if (err) {
				logger.error('failed saving userdata: ' + err);
			}
		});

		fs.writeFile('./data/guildsettings.json', JSON.stringify(cs.get('guildSettings')), (err) => {
			if (err) {
				logger.error('failed saving guildsettings: ' + err);
			}
		});
	}, 120000);

	// update boteline coin stuff
	cs.setClient(bot);

	logger.info('ready!');
	firedReady = true;
	process.title = `${cs.get('botName')} v${cs.get('version')}`;
}