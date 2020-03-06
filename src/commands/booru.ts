import * as booru from 'booru';
import * as util from '../lib/util';
import * as Discord from 'discord.js';
import * as CommandSystem from 'cumsystem';

export function addCommands(cs: CommandSystem.System) {
	cs.addCommand('utilities', new CommandSystem.Command('boorufetch', msg => {
		const params = util.getParams(msg);

		let tags = params.slice(1);

		if (Object.keys(booru.sites).includes(params[0])) {
			booru.search(params[0], tags, {limit: 1, random: true})
				.then(results => {
					let img = results[0];

					let embed = new Discord.MessageEmbed()
						.setTitle(img.postView)
						.setImage(img.fileUrl)
						.setColor('#334433')
						.setDescription(`Score: ${img.score}\nTags: \`${img.tags.join(', ')}\`${img.source ? `\n[Source](${img.source})` : ''}`);

					msg.channel.send(embed);
				});
		} else {
			msg.channel.send('That site isn\'t supported!');
		}
	})
		.setDescription('searches a booru site for tags\nthe available sites can be checked here: https://github.com/AtlasTheBot/booru/blob/HEAD/src/sites.json')
		.setNSFW()
		.setUsage('(string) (string)')
		.setDisplayUsage('(site) (tags..)'));
}