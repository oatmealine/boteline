import * as format from '../lib/format';
import * as Discord from 'discord.js';
import * as CommandSystem from 'cumsystem';
const got = require('got');

Discord; // fuck you ts

let logger;

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

function checkSplatoon() : Promise<any> {
	return new Promise(resolve => {
		if (cache.splatoon !== undefined) {
			if (cache.splatoon.timer.getHours() >= new Date().getHours() && new Date(cache.splatoon.timer.getTime()+1200000) >= new Date()) {
				resolve(cache.splatoon);
				return;
			}
		}

		logger.debug('fetching splatoon2.ink data...');

		got('https://splatoon2.ink/data/schedules.json', {
			'user-agent': 'Boteline (oatmealine#1704)'
		}).then(res => {
			logger.debug('got code ' + res.statusCode);
			if (res.statusCode === 200) {
				logger.debug('done!');
				cache.splatoon.data = JSON.parse(res.body);
				cache.splatoon.timer = new Date();
				resolve(cache.splatoon);
			} else {
				logger.warn('failed to fetch splatoon2.ink data, using potentially outdated data');
				resolve(cache.splatoon);
			}
		});
	});
}

function checkSalmon() : Promise<any> {
	return new Promise(resolve => {
		if (cache.salmon !== undefined) {
			if (cache.salmon.timer.getHours() >= new Date().getHours() && new Date(cache.salmon.timer.getTime()+1200000) >= new Date()) {
				resolve(cache.salmon);
				return;
			}
		}

		logger.debug('fetching splatoon2.ink data...');
		got('https://splatoon2.ink/data/schedules.json', {
			'user-agent': 'Boteline (oatmealine#1704)'
		}).then(res => {
			logger.debug('got code ' + res.statusCode);
			if (res && res.statusCode === 200) {
				logger.debug('done!');
				cache.salmon.data = JSON.parse(res.body);
				cache.salmon.timer = new Date();
				resolve(cache.salmon);
			} else {
				logger.warn('failed to fetch splatoon2.ink data, using potentially outdated data');
				resolve(cache.salmon);
			}
		});
	});
}

export function addCommands(cs: CommandSystem.System) {
	logger = cs.get('logger');

	cs.addCommand(new CommandSystem.Command('splatoon', (msg) => {
		checkSplatoon().then(obj => {
			let data = obj.data;

			let timeLeft = Math.floor(data.league[0].end_time - Date.now() / 1000);

			const regularemote = cs.client.emojis.cache.get('639188039503183907') !== undefined ? cs.client.emojis.cache.get('639188039503183907').toString() + ' ' : '';
			const rankedemote = cs.client.emojis.cache.get('639188039658242078') !== undefined ? cs.client.emojis.cache.get('639188039658242078').toString() + ' ' : '';
			const leagueemote = cs.client.emojis.cache.get('639188038089703452') !== undefined ? cs.client.emojis.cache.get('639188038089703452').toString() + ' ' : '';

			let embed = new Discord.MessageEmbed()
				.setTitle('Splatoon 2 Map Schedules')
				.addField(regularemote + 'Regular Battle',
					`${data.regular[0].stage_a.name}, ${data.regular[0].stage_b.name}
${data.regular[0].rule.name}`)
				.addField(rankedemote + 'Ranked Battle',
					`${data.gachi[0].stage_a.name}, ${data.gachi[0].stage_b.name}
${data.gachi[0].rule.name}`)
				.addField(leagueemote + 'League Battle',
					`${data.league[0].stage_a.name}, ${data.league[0].stage_b.name}
${data.league[0].rule.name}`)
				.setColor('22FF22')
				.setDescription(`${format.formatTime(new Date(data.league[0].start_time * 1000))} - ${format.formatTime(new Date(data.league[0].end_time * 1000))}
${Math.floor(timeLeft / 60 / 60) % 24}h ${Math.floor(timeLeft / 60) % 60}m ${timeLeft % 60}s left`)
				.setURL('https://splatoon2.ink/')
				.setImage('https://splatoon2.ink/assets/splatnet' + data.regular[0].stage_a.image)
				.setFooter('Data last fetched ' + obj.timer.toDateString() + ', ' + format.formatTime(obj.timer) + ' - Data provided by splatoon2.ink');

			msg.channel.send('', embed);
		});
	})
		.setCategory('utilities')
		.addAlias('splatoonschedule')
		.addAlias('splatoon2')
		.setDescription('Check the schedule of the Splatoon 2 stage rotations')
		.addClientPermission('EMBED_LINKS'));

	cs.addCommand(new CommandSystem.Command('salmonrun', (msg) => {
		checkSalmon().then(obj => {
			let data = obj.data;

			let timeLeftEnd = Math.floor(data.details[0].end_time - Date.now() / 1000);
			let timeLeftStart = Math.floor(data.details[0].start_time - Date.now() / 1000);

			let weapons = [];
			data.details[0].weapons.forEach(w => {
				weapons.push(w.weapon.name);
			});

			let embed = new Discord.MessageEmbed()
				.setTitle('Splatoon 2 Salmon Run Schedule')
				.addField('Weapons',
					`${weapons.join(', ')}`)
				.addField('Map',
					`${data.details[0].stage.name}`)
				.setColor('FF9922')
				.setDescription(`${new Date(data.details[0].start_time * 1000).toUTCString()} - ${new Date(data.details[0].end_time * 1000).toUTCString()}
${timeLeftStart < 0 ? `${Math.floor(timeLeftEnd / 60 / 60) % 24}h ${Math.floor(timeLeftEnd / 60) % 60}m ${timeLeftEnd % 60}s left until end` : `${Math.floor(timeLeftStart / 60 / 60) % 24}h ${Math.floor(timeLeftStart / 60) % 60}m ${timeLeftStart % 60}s left until start`}`)
				.setURL('https://splatoon2.ink/')
				.setImage('https://splatoon2.ink/assets/splatnet' + data.details[0].stage.image)
				.setFooter('Data last fetched ' + obj.timer.toDateString() + ', ' + format.formatTime(obj.timer) + ' - Data provided by splatoon2.ink');

			msg.channel.send('', embed);
		});
	})
		.setCategory('utilities')
		.addAlias('salmon')
		.addAlias('salmonschedule')
		.setDescription('Check the schedule of the Splatoon 2 Salmon Run stage/weapon rotations')
		.addClientPermission('EMBED_LINKS'));
}