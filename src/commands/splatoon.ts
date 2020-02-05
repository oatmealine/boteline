import * as util from '../lib/util.js';
import * as Discord from 'discord.js';

Discord; // fuck you ts

export function addCommands(cs, bot: Discord.Client) {
	cs.addCommand('utilities', new cs.Command('splatoon', (msg) => {
		util.checkSplatoon().then(obj => {
			let data = obj.data;

			let timeLeft = Math.floor(data.league[0].end_time - Date.now() / 1000);

			const regularemote = bot.emojis.get('639188039503183907') !== undefined ? bot.emojis.get('639188039503183907').toString() + ' ' : '';
			const rankedemote = bot.emojis.get('639188039658242078') !== undefined ? bot.emojis.get('639188039658242078').toString() + ' ' : '';
			const leagueemote = bot.emojis.get('639188038089703452') !== undefined ? bot.emojis.get('639188038089703452').toString() + ' ' : '';

			let embed = new Discord.RichEmbed()
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
				.setDescription(`${util.formatTime(new Date(data.league[0].start_time * 1000))} - ${util.formatTime(new Date(data.league[0].end_time * 1000))}
${Math.floor(timeLeft / 60 / 60) % 24}h ${Math.floor(timeLeft / 60) % 60}m ${timeLeft % 60}s left`)
				.setURL('https://splatoon2.ink/')
				.setImage('https://splatoon2.ink/assets/splatnet' + data.regular[0].stage_a.image)
				.setFooter('Data last fetched ' + obj.timer.toDateString() + ', ' + util.formatTime(obj.timer) + ' - Data provided by splatoon2.ink');

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

			let timeLeftEnd = Math.floor(data.details[0].end_time - Date.now() / 1000);
			let timeLeftStart = Math.floor(data.details[0].start_time - Date.now() / 1000);

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
				.setDescription(`${new Date(data.details[0].start_time * 1000).toUTCString()} - ${new Date(data.details[0].end_time * 1000).toUTCString()}
${timeLeftStart < 0 ? `${Math.floor(timeLeftEnd / 60 / 60) % 24}h ${Math.floor(timeLeftEnd / 60) % 60}m ${timeLeftEnd % 60}s left until end` : `${Math.floor(timeLeftStart / 60 / 60) % 24}h ${Math.floor(timeLeftStart / 60) % 60}m ${timeLeftStart % 60}s left until start`}`)
				.setURL('https://splatoon2.ink/')
				.setImage('https://splatoon2.ink/assets/splatnet' + data.details[0].stage.image)
				.setFooter('Data last fetched ' + obj.timer.toDateString() + ', ' + util.formatTime(obj.timer) + ' - Data provided by splatoon2.ink');

			msg.channel.send('', embed);
		});
	})
		.addAlias('salmon')
		.addAlias('salmonschedule')
		.setDescription('Check the schedule of the Splatoon 2 Salmon Run stage/weapon rotations')
		.addClientPermission('EMBED_LINKS'));
}