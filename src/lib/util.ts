const got = require('got');

import * as Discord from 'discord.js';
import * as fs from 'fs';

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

export function progress(prog: number, max: number, len: number = 10) : string {
	return '█'.repeat(Math.floor((prog / max) * len)) + '_'.repeat(len - (prog / max) * len);
}

export function makeDrinkEmbed(drink: any) : Discord.MessageEmbed {
	const embed = new Discord.MessageEmbed({
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

export function checkSalmon() : Promise<any> {
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

export function formatTime(date : Date) : string {
	let hours = date.getUTCHours();
	let minutes = date.getUTCMinutes();

	return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes} UTC`;
}

export function formatDate(date : Date) : string {
	let day = date.getUTCDate();
	let month = date.getUTCMonth();
	let year = date.getUTCFullYear();

	return `${day}/${month+1}/${year} ${formatTime(date)}`;
}

export function readIfExists(path : fs.PathLike, options? : {encoding?: string | null, flag?: string}, ifNonExistant? : any) {
	if (fs.existsSync(path)) {
		return fs.readFileSync(path, options);
	} else {
		return ifNonExistant;
	}
}

export function shortenStr(str: string, chars: number) {
	if (str.length > chars)
		return str.substr(0, chars - 3).trimRight() + '...';

	return str;
}

// discord utils
export function parseUser(bot : Discord.Client, parse : string, guild? : Discord.Guild) : Discord.User | null {
	if(parse.startsWith('<@') && parse.startsWith('>')) {
		parse = parse.substr(2, parse.length-3);
	}

	if(!isNaN(Number(parse))) {
		return bot.users.cache.get(parse) === undefined ? null : bot.users.cache.get(parse);
	} else {
		if (parse.split('#').length === 2) {
			let name = parse.split('#')[0];
			let discrim = parse.split('#')[1];
			let users = bot.users.cache.filter(u => u.username === name && u.discriminator === discrim);
	
			if (users.size === 1) {
				return users.first();
			}
		}

		if (guild) {
			let users = guild.members.cache.filter(u => u.nickname !== null && u.nickname.toLowerCase().startsWith(parse.toLowerCase()));
			if (users.size > 0) {
				return users.first().user;
			}

			users = guild.members.cache.filter(u => u.nickname !== null && u.nickname.toLowerCase() === parse.toLowerCase());
			if (users.size > 0) {
				return users.first().user;
			}

			users = guild.members.cache.filter(u => u.user.username.toLowerCase() === parse.toLowerCase());
			if (users.size > 0) {
				return users.first().user;
			}

			users = guild.members.cache.filter(u => u.user.username.toLowerCase().startsWith(parse.toLowerCase()));
			if (users.size > 0) {
				return users.first().user;
			}
		}

		return null;
	}
}

export function starboardEmbed(message : Discord.Message | Discord.PartialMessage, starboardSettings, edited = false, reaction? : Discord.MessageReaction) {
	if (!reaction) {
		if (starboardSettings.guildEmote) {
			reaction = message.reactions.cache.find(reac => reac.emoji.id === starboardSettings.emote);
		} else {
			reaction = message.reactions.cache.find(reac => reac.emoji.toString() === starboardSettings.emote);
		}
	}

	let embed = new Discord.MessageEmbed()
		.setAuthor(message.author.username + '#' + message.author.discriminator, message.author.avatarURL({dynamic: true}))
		.setTimestamp(message.createdTimestamp)
		.setFooter(`${reaction.count} ${reaction.emoji.name}s`, starboardSettings.guildEmote ? reaction.message.guild.emojis.cache.find(em => em.id === reaction.emoji.id).url : undefined)
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
		embed.addField('Attached files', message.attachments.map(at => `- [${at.name}](${at.url}) (${formatFileSize(at.size)})`).join('\n'));
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
	let pat = /\[(.+?)\]/g;
	return str.replace(pat, (_, link) => {
		return `[${link}](https://www.urbandictionary.com/define.php?term=${encodeURI(link)})`;
	});
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

export function formatMiliseconds(ms : number) {
	let days = Math.floor(ms / 76800);
	let hours = Math.floor(ms / 3200) % 24;
	let minutes = Math.floor(ms / 60) % 60;
	let seconds = Math.floor(ms) % 60;

	return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export function objectFlip(obj) : Object {
	const ret = {};
	Object.keys(obj).forEach(key => {
		ret[obj[key]] = key;
	});
	return ret;
}

export function replaceAll(str: string, match: string, replace = '') : string {
	return str.split(match).join(replace);
}

export function formatMinecraftCode(str: string) : string {
	// §
	let splits = replaceAll(str, '\n', '§x').split('§'); // §x isnt real, and we use it as a newline here 
	let newSplits = [];

	let closeBy = [];

	splits.forEach((v, i) => {
		newSplits[i] = v;
		if (i === 0) return;

		switch (v[0]) {
		case 'm':
			if (closeBy.includes('~~')) return;
			newSplits[i] = '~~' + v.slice(1);
			closeBy.push('~~');
			break;
		case 'n':
			if (closeBy.includes('__')) return;
			newSplits[i] = '__' + v.slice(1);
			closeBy.push('__');
			break;
		case 'l':
			if (closeBy.includes('**')) return;
			newSplits[i] = '**' + v.slice(1);
			closeBy.push('**');
			break;
		case 'o':
			if (closeBy.includes('*')) return;
			newSplits[i] = '*' + v.slice(1);
			closeBy.push('*');
			break;
		case '1':
		case '2':
		case '3':
		case '4':
		case '5':
		case '6':
		case '7':
		case '8':
		case '9':
		case 'a':
		case 'b':
		case 'c':
		case 'd':
		case 'e':
		case 'f':
		case 'r':
			newSplits[i] = closeBy.reverse().join('') + v.slice(1);
			closeBy = []; 
			break;
		case 'x':
			newSplits[i] = closeBy.reverse().join('') + '\n' + v.slice(1);
			closeBy = []; 
			break;
		default:
			newSplits[i] = v.slice(1);
		}
	});

	return newSplits.join('') + closeBy.reverse().join('');
}

export async function fetchAttachment(msg: Discord.Message, acceptedFiletypes = [], disableSizeLimit = false) {
	let attachments: Discord.MessageAttachment[] = [];

	if (msg.attachments.size === 0) {
		await msg.channel.messages.fetch({ limit: 20 }).then((msges) => {
			msges.array().forEach((m: Discord.Message) => {
				// checking attachments
				if (m.attachments.size > 0) {
					m.attachments.array().forEach((att) => {
						if (disableSizeLimit || att.size <= 8000000) attachments.push(att);
					});
				}

				// checking embeds
				if (m.embeds.length > 0) {
					m.embeds.forEach(em => {
						if (em.type !== 'rich' && em.title === undefined && em.provider === null) attachments.push(new Discord.MessageAttachment(em.url)); // not really a better way to test for this
						
						if (em.provider !== null && em.provider.name === 'Tenor') { // tenor compat
							attachments.push(new Discord.MessageAttachment(em.video.url, 'tenor.mp4'));
						}

						if (em.image) attachments.push(new Discord.MessageAttachment(em.image.url));
						if (em.thumbnail) attachments.push(new Discord.MessageAttachment(em.thumbnail.url));
					});
				}
			});
		});
	} else {
		attachments.push(msg.attachments.first());
	}

	if (attachments.length > 0) {
		let attach: Discord.MessageAttachment;
		attachments.forEach((attachment) => {
			if (attach || !attachment) return;

			if (!attachment.url) {
				if (typeof attachment.attachment === 'string') {
					attachment.url = attachment.attachment;
				} else return;
			}

			if (!attachment.name) attachment.name = attachment.url;

			const filetype = attachment.name.split('.').pop();
			if (acceptedFiletypes.includes(filetype.toLowerCase()) || acceptedFiletypes.length === 0) {
				attach = attachment;
			}
		});

		if (!attach) throw new Error('No suitable attachments found');
		return attach;
	} else {
		throw new Error('No attachments found');
	}
}

export function setLogger(log) {
	logger = log;
}