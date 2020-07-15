import * as CommandSystem from 'cumsystem';
import * as util from '../lib/util';
import * as Paginator from '../lib/paginator';
import * as Discord from 'discord.js';
const got = require('got');

export function addCommands(cs: CommandSystem.System) {

	cs.addCommand(new CommandSystem.Command('urban', async (msg, content) => {
		let res = await got(`https://api.urbandictionary.com/v0/define?term=${encodeURI(content)}`);
		let data = JSON.parse(res.body);
		
		if (data.list.length === 0) return msg.channel.send('that word doesnt exist!');

		let paginator = new Paginator.Paginator((count) => {
			let json = data.list[count];

			if (json.example === '') {json.example = '(no example given)';}
	
			let embed = new Discord.MessageEmbed()
				.setTitle(json.word)
				.setURL(json.permalink)
			// the written_on thing is like that because of the date format being:
			// YYYY-mm-ddT00:00:00.000Z
			// note that the last time is always 0:00
				.setDescription(`written on ${json.written_on.slice(0, 10)} by ${json.author}\n${json.thumbs_up || '??'} :thumbsup: ${json.thumbs_down || '??'} :thumbsdown:`)
				.addField('Defintion', util.shortenStr(util.replaceUrbanLinks(json.definition), 1024), true)
				.addField('Example', util.shortenStr(util.replaceUrbanLinks(json.example), 1024), false)
				.setFooter(`${paginator.count}/${paginator.limit}`);
	
			return embed;
		}, msg.author);

		paginator.setLimit(data.list.length);
		return paginator.start(msg.channel);
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