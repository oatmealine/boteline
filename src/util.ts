import * as rq from 'request';
import * as Discord from 'discord.js';
import * as foxconsole from './foxconsole.js';
import * as fs from 'fs';

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

export function progress(prog: number, max: number, len: number = 10) : string {
	return '█'.repeat(Math.floor((prog / max) * len)) + '_'.repeat(len - (prog / max) * len);
}

export function makeDrinkEmbed(drink: any) : Discord.RichEmbed {
	const embed = new Discord.RichEmbed({
		title: drink.name,
		fields: [
			{
				name: 'Description',
				value: '"' + drink.blurb + '"',
			},
			{
				name: 'Flavor',
				value: drink.flavour,
				inline: true,
			},
			{
				name: 'Type',
				value: drink.type.join(', '),
				inline: true,
			},
			{
				name: 'Price',
				value: '$' + drink.price,
				inline: true,
			},
			{
				name: 'Preparation',
				value: `A **${drink.name}** is **${drink.ingredients.adelhyde}** Adelhyde, **${drink.ingredients.bronson_extract}** Bronson Extract, **${drink.ingredients.powdered_delta}** Powdered Delta, **${drink.ingredients.flangerine}** Flangerine ${drink.ingredients.karmotrine === 'optional' ? 'with *(optional)*' : `and **${drink.ingredients.karmotrine}**`} Karmotrine. All ${drink.aged ? `aged${drink.iced ? ', ' : ' and '}` : ''}${drink.iced ? 'on the rocks and ' : ''}${drink.blended ? 'blended' : 'mixed'}.`,
			},
		],
		footer: { text: 'CALICOMP 1.1' }
	}).setColor([255, 0, 255]);
	return embed;
}

export function hashCode(str: string) : number {
	let hash = 0, i, chr;
	if (str.length === 0) { return hash; }
	for (i = 0; i < str.length; i++) {
		chr = str.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
}

export function getParams(message: Discord.Message) : string[] {
	return message.content.split(' ').slice(1, message.content.length);
}

export function roundNumber(num: number, decimals: number) {
	return Math.round(num*Math.pow(10, decimals))/Math.pow(10, decimals);
}

export function normalDistribution(x: number) : number {
	return Math.pow(Math.E, (-Math.PI * x * x));
}

export function seedAndRate(str: string) : number {
	const exclusions = {boteline: 0, mankind: 0, fox: 10, thefox: 10};

	if (Object.keys(str).includes('str')) {
		return exclusions[str];
	} else {
		const hc = Math.abs(hashCode(str));
		return Math.round(normalDistribution(hc % 0.85) * 10);
	}
}

export function checkSplatoon() : Promise<any> {
	return new Promise(resolve => {
		if (cache.splatoon !== undefined) {
			if (cache.splatoon.timer.getHours() >= new Date().getHours() && new Date(cache.splatoon.timer.getTime()+1200000) >= new Date()) {
				resolve(cache.splatoon);
				return;
			}
		}

		foxconsole.debug('fetching splatoon2.ink data...');
		rq('https://splatoon2.ink/data/schedules.json', {
			'user-agent': 'Boteline (oatmealine#1704)'
		}, (err, response, body) => {
			foxconsole.debug('got code '+response.statusCode);
			if (response.statusCode === 200 && !err) {
				foxconsole.debug('done!');
				cache.splatoon.data = JSON.parse(body);
				cache.splatoon.timer = new Date();
				resolve(cache.splatoon);
			} else {
				foxconsole.warning('failed to fetch splatoon2.ink data, using potentially outdated data');
				resolve(cache.splatoon);
			}
		});
	});
}

export function checkSalmon() : Promise<any> {
	return new Promise(resolve => {
		if (cache.salmon !== undefined) {
			if (cache.salmon.timer.getHours() >= new Date().getHours() && new Date(cache.salmon.timer.getTime()+1200000) >= new Date()) {
				resolve(cache.salmon);
				return;
			}
		}

		foxconsole.debug('fetching splatoon2.ink data...');
		rq('https://splatoon2.ink/data/coop-schedules.json', {
			'user-agent': 'Boteline (oatmealine#1704)'
		}, (err, response, body : string) => {
			foxconsole.debug('got code '+response.statusCode);
			if (response.statusCode === 200 && !err) {
				foxconsole.debug('done!');
				cache.salmon.data = JSON.parse(body);
				cache.salmon.timer = new Date();
				resolve(cache.salmon);
			} else {
				foxconsole.warning('failed to fetch splatoon2.ink data, using potentially outdated data');
				resolve(cache.salmon);
			}
		});
	});
}

export function formatTime(date : Date) : string {
	let hours = date.getUTCHours();
	let minutes = date.getUTCMinutes();

	return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes} UTC`;
}

export function readIfExists(path : fs.PathLike, options? : {encoding?: string | null, flag?: string}, ifNonExistant? : any) {
	if (fs.existsSync(path)) {
		return fs.readFileSync(path, options);
	} else {
		return ifNonExistant;
	}
}

export function shortenStr(str: string, chars: number) {
	return str.substr(0, chars).trimRight() + ((str.length > chars) ? '...' : '');
}

// discord utils
export function parseUser(bot : Discord.Client, parse : string, guild? : Discord.Guild) : Discord.User | null {
	if(parse.startsWith('<@') && parse.startsWith('>')) {
		parse = parse.substr(2, parse.length-3);
	}

	if(!isNaN(Number(parse))) {
		return bot.users.get(parse) === undefined ? null : bot.users.get(parse);
	} else {
		if (parse.split('#').length === 2) {
			let name = parse.split('#')[0];
			let discrim = parse.split('#')[1];
			let users = bot.users.filter(u => u.username === name && u.discriminator === discrim);
	
			if (users.size === 1) {
				return users.first();
			}
		}

		if (guild) {
			let users = guild.members.filter(u => u.nickname !== null && u.nickname.toLowerCase().startsWith(parse.toLowerCase()));
			if (users.size > 0) {
				return users.first().user;
			}

			users = guild.members.filter(u => u.nickname !== null && u.nickname.toLowerCase() === parse.toLowerCase());
			if (users.size > 0) {
				return users.first().user;
			}

			users = guild.members.filter(u => u.user.username.toLowerCase() === parse.toLowerCase());
			if (users.size > 0) {
				return users.first().user;
			}

			users = guild.members.filter(u => u.user.username.toLowerCase().startsWith(parse.toLowerCase()));
			if (users.size > 0) {
				return users.first().user;
			}
		}

		return null;
	}
}

export function starboardEmbed(message : Discord.Message, starboardSettings, edited = false, reaction? : Discord.MessageReaction) {
	if (!reaction) {
		if (starboardSettings.guildEmote) {
			reaction = message.reactions.find(reac => reac.emoji.id === starboardSettings.emote);
		} else {
			reaction = message.reactions.find(reac => reac.emoji.toString() === starboardSettings.emote);
		}
	}

	let embed = new Discord.RichEmbed()
		.setAuthor(message.author.username + '#' + message.author.discriminator, message.author.avatarURL)
		.setTimestamp(message.createdTimestamp)
		.setFooter(`${reaction.count} ${reaction.emoji.name}s`, starboardSettings.guildEmote ? reaction.message.guild.emojis.find(em => em.id === reaction.emoji.id).url : undefined)
		.setColor('FFFF00');

	let msglink = `[Original](${message.url})`;

	message.embeds.forEach(em => {
		if (em.thumbnail && !embed.thumbnail) {
			embed.setThumbnail(em.thumbnail.url);
		}
		if (em.image && !embed.image) {
			embed.setImage(em.image.url);
		}
		if (em.provider) {
			msglink = `This message seems to have an embed provided by [${em.provider.name}](${em.provider.url}). Click [here](${message.url}) to see the original message`;
		} else {
			msglink = `This message seems to have an embed. Click [here](${message.url}) to see the original message`;
		}
	});

	if (message.attachments.size > 0) {
		embed.addField('Attached files', message.attachments.map(at => `- [${at.filename}](${at.url}) (${formatFileSize(at.filesize)})`).join('\n'));
	}

	embed.setDescription(`${msglink}${edited ? ' (edited)' : ''}\n\n` + shortenStr(message.content, 900));

	return embed;
}

export function decimalToNumber(num) : string {
	switch (num) {
	case 1: return 'one'; break;
	case 2: return 'two'; break;
	case 3: return 'three'; break;
	case 4: return 'four'; break;
	case 5: return 'five'; break;
	case 6: return 'six'; break;
	case 7: return 'seven'; break;
	case 8: return 'eight'; break;
	case 9: return 'nine'; break;
	case 0: return 'zero'; break;
	}

	return 'zero';
}

export function replaceUrbanLinks(str : string) {
	// unimplemented
	return str.split('[').join('').split(']').join('');
}

export function formatFileSize(bytes : number, si : boolean = false) {
	let thresh = si ? 1000 : 1024;
	if (Math.abs(bytes) < thresh) {
		return bytes + ' B';
	}
	let units = si
		? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
		: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
	let u = -1;
	do {
		bytes /= thresh;
		++u;
	} while (Math.abs(bytes) >= thresh && u < units.length - 1);
	return bytes.toFixed(1) + ' ' + units[u];
}