import * as util from '../lib/util';
import * as CommandSystem from 'cumsystem';
// eslint-disable-next-line no-unused-vars
import * as Discord from 'discord.js';

let starboardBinds = {};
let guildSettings;

function handleReactions(reaction, user) {
	if (reaction.message.guild !== null && guildSettings[reaction.message.guild.id] !== undefined && guildSettings[reaction.message.guild.id].starboard !== undefined) {
		let starboardSettings = guildSettings[reaction.message.guild.id].starboard;

		if (starboardSettings.guildEmote) {
			if (starboardSettings.emote !== reaction.emoji.id) return;
		} else {
			if (starboardSettings.emote !== reaction.emoji.toString()) return;
		}

		if (user.id === reaction.message.author.id || user.bot) {
			reaction.remove(user);
			return;
		}

		if (reaction.count >= starboardSettings.starsNeeded) {
			let channel = reaction.message.guild.channels.cache.find(ch => ch.id === starboardSettings.channel);

			if (channel) {
				let embed = util.starboardEmbed(reaction.message, starboardSettings, false, reaction);

				if(reaction.message.attachments) {
					let image = reaction.message.attachments.filter(at => at.width !== null).first();
					if (image) embed.setImage(image.url);
				}

				if (starboardBinds[reaction.message.id]) {
					starboardBinds[reaction.message.id].edit('', {embed: embed});
				} else {
					channel.send('', {embed: embed})
						.then(m => {
							starboardBinds[reaction.message.id] = m;
						});
				}
			}
		} else if (starboardBinds[reaction.message.id]) {
			starboardBinds[reaction.message.id].delete();
			delete starboardBinds[reaction.message.id];
		}
	}
}

export function addCommands(cs: CommandSystem.System) {
	guildSettings = cs.get('guildSettings');

	cs.addCommand(new CommandSystem.Command('starboard', (msg : Discord.Message) => {
		let params = util.getParams(msg);

		let channel = msg.guild.channels.cache.find(c => c.id === params[0].replace('<#','').replace('>',''));
		if(!channel) {
			return msg.channel.send('channel doesnt exist!');
		} else {
			if(!channel.permissionsFor(msg.guild.me).has('SEND_MESSAGES')) return msg.channel.send('i cant send messages there!');
			if(!channel.permissionsFor(msg.guild.me).has('EMBED_LINKS')) return msg.channel.send('i cant add embeds there!');
		}

		if (!params[2]) params[2] = '⭐';
		let emote = msg.guild.emojis.cache.find(em => em.id === params[2].slice(-19,-1));

		if (!guildSettings[msg.guild.id]) guildSettings[msg.guild.id] = {};

		if (params[1] !== '0') {
			guildSettings[msg.guild.id].starboard = {channel: channel.id, starsNeeded: Number(params[1]), emote: emote ? emote.id : params[2], guildEmote: emote !== undefined};

			let starSettings = guildSettings[msg.guild.id].starboard;
			return msg.channel.send(`gotcha! all messages with ${starSettings.starsNeeded} ${starSettings.guildEmote ? msg.guild.emojis.cache.get(starSettings.emote).toString() : starSettings.emote} reactions will be quoted in <#${starSettings.channel}>`);
		} else {
			delete guildSettings[msg.guild.id].starboard;
			return msg.channel.send('removed starboard from server!');
		}
	})
		.setCategory('moderating')
		.addAlias('board')
		.addAlias('setStarboard')
		.addUserPermission('MANAGE_CHANNELS')
		.addClientPermission('MANAGE_MESSAGES')
		.setUsage('(string) (number) [string]')
		.setDisplayUsage('(channel) (reacts needed) [emote]')
		.setDescription('changes the starboard location, set reacts needed to 0 to remove')
		.setGuildOnly());

	let bot = cs.client;

	bot.on('messageUpdate', (oldMsg, msg) => {
		if (msg.guild !== null && guildSettings[msg.guild.id] !== undefined && guildSettings[msg.guild.id].starboard !== undefined) {
			let starboardSettings = guildSettings[msg.guild.id].starboard;

			if (starboardBinds[msg.id]) {
				let embed = util.starboardEmbed(msg, starboardSettings, true);

				starboardBinds[msg.id].edit('', {embed: embed});
			}
		}
	});

	bot.on('messageDelete', (msg) => {
		if(msg.guild !== null && guildSettings[msg.guild.id] !== undefined && guildSettings[msg.guild.id].starboard !== undefined) {
			if (starboardBinds[msg.id]) {
				starboardBinds[msg.id].delete();
				delete starboardBinds[msg.id];
			}
		}
	});


	bot.on('messageReactionAdd', handleReactions);
	bot.on('messageReactionRemove', handleReactions);
}