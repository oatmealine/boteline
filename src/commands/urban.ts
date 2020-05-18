import * as CommandSystem from 'cumsystem';
import * as util from '../lib/util';
import * as urban from 'urban';
import * as Discord from 'discord.js';

export function addCommands(cs: CommandSystem.System) {

	cs.addCommand(new CommandSystem.Command('urban', msg => {
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
		.setCategory('utilities')
		.addAlias('urb')
		.addAlias('urbandict')
		.addExample('discord')
		.setUsage('[string]')
		.setDisplayUsage('[word]')
		.setDescription('check the definition of a word on urban dictionary')
		.addClientPermission('EMBED_LINKS'));
}