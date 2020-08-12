import * as Discord from 'discord.js';
import * as format from './format';
import * as util from './util';
import * as youtubedl from 'youtube-dl';

const maxVideoLength = 60 * 3; // 3 mins
const wantedVideoHeight = 480; // 720, 1080, etc

export async function fetchAttachment(msg: Discord.Message, acceptedFiletypes = [], disableSizeLimit = false) {
	let attachments: Discord.MessageAttachment[] = [];

	if (msg.attachments.size === 0) {
		let msges = await msg.channel.messages.fetch({ limit: 20 });

		for (let m of msges.array()) {
			// checking attachments
			if (m.attachments.size > 0) {
				m.attachments.array().forEach((att) => {
					if (disableSizeLimit || att.size <= 8000000) attachments.push(att);
				});
			}

			// checking embeds
			if (m.embeds.length > 0) {
				for (let em of m.embeds) {
					if (em.type !== 'rich' && em.title === undefined && em.provider === null) attachments.push(new Discord.MessageAttachment(em.url)); // not really a better way to test for this
						
					if (em.provider && em.provider.name === 'Tenor') { // tenor compat
						attachments.push(new Discord.MessageAttachment(em.video.url, 'tenor.mp4'));
					}
					
					// youtube-dl compat
					// okay, heres where i die
					let url = em.url;
					// eslint-disable-next-line no-unused-vars
					let err, res = await require('util').promisify(youtubedl.getInfo)(url);

					if (err || res._duration_raw > maxVideoLength) continue;

					let formats = res.formats.filter(r => !r.format.includes('audio only')).sort((a, b) => Math.abs(a.height - wantedVideoHeight) - Math.abs(b.height - wantedVideoHeight)).reverse();
					if (formats.size === 0) continue;

					attachments.push(new Discord.MessageAttachment(formats[0].url, 'video.mp4'));

					if (em.image) attachments.push(new Discord.MessageAttachment(em.image.url));
					if (em.thumbnail) attachments.push(new Discord.MessageAttachment(em.thumbnail.url));
				}
			}
		}
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

			const filetype = attachment.name.split('/').pop().split('.').pop();
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
		embed.addField('Attached files', message.attachments.map(at => `- [${at.name}](${at.url}) (${format.formatFileSize(at.size)})`).join('\n'));
	}

	embed.setDescription(`${msglink}${edited ? ' (edited)' : ''}\n\n` + util.shortenStr(message.content, 900));

	return embed;
}

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

export function getParams(message: Discord.Message) : string[] {
	return message.content.split(' ').slice(1, message.content.length);
}