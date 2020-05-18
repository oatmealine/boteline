import * as CommandSystem from 'cumsystem';
import * as Discord from 'discord.js';
import * as util from '../lib/util';
import * as mcServer from 'minecraft-server-util';

export function addCommands(cs: CommandSystem.System) {
	cs.addCommand(new CommandSystem.Command('achievement', (msg) => {
		const params = util.getParams(msg);
		msg.channel.send('', { files: [{ attachment: 'https://minecraftskinstealer.com/achievement/1/Achievement+Get%21/' + encodeURI(params.join('+')), name: 'achievement.png' }] });
	})
		.setCategory('fun')
		.addAlias('advancement')
		.setDescription('make a minecraft achievement')
		.setUsage('(string)')
		.addExample('Made an example!')
		.addClientPermission('ATTACH_FILES'));

	cs.addCommand(new CommandSystem.Command('mcping', (msg) => {
		const params = util.getParams(msg);
		msg.channel.startTyping();
	
		mcServer(params[0], params[1])
			.then(res => {
				msg.channel.stopTyping();

				const embed = new Discord.MessageEmbed()
					.setTitle(res.host + ':' + res.port)
					.setDescription(util.formatMinecraftCode(res.descriptionText))
					.addField('Version', `${res.version} (protocol version: ${res.protocolVersion})`, true);
			
				if (res.samplePlayers !== null && res.samplePlayers.length > 0) {
					embed.addField(`Players - ${res.onlinePlayers}/${res.maxPlayers}`, 
						util.shortenStr(
							res.samplePlayers.map(pl => `- ${pl.name}`)
								.join('\n'), 1024)
					);
				} else {
					embed.setDescription(embed.description + `\n${res.onlinePlayers}/${res.maxPlayers} online`);
				}

				if (res.modList !== null && res.modList.length > 0) {
					embed.addField('Mods', util.shortenStr(
						res.modList.map(mod => `- ${mod.modid} v${mod.version}`)
							.join('\n'), 1024)
					);
				}
			
				msg.channel.send(embed);
			})
			.catch(err => {
				msg.channel.stopTyping();

				msg.channel.send(err.toString());
			});
	})
		.setCategory('utilities'));
}