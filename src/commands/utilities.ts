import * as CommandSystem from 'cumsystem';
// eslint-disable-next-line no-unused-vars
import * as Discord from 'discord.js';
import * as util from '../lib/util';

export function addCommands(cs: CommandSystem.System) {
	cs.addCommand('utilities', new CommandSystem.Command('icon', (message) => {
		message.channel.send({ files: [{ attachment: message.guild.iconURL, name: 'icon.png' }] });
	})
		.addAlias('servericon')
		.addAlias('serverpic')
		.setDescription('get the server\'s icon')
		.addClientPermission('ATTACH_FILES')
		.setGuildOnly());

	cs.addCommand('utilities', new CommandSystem.Command('pfp', (msg) => {
		const params = util.getParams(msg);
		let user: Discord.User;

		if (params[0] !== undefined) {
			user = util.parseUser(cs.client, params[0], msg.guild);
		} else {
			user = msg.author;
		}
		msg.channel.send('', { files: [{ attachment: user.displayAvatarURL({dynamic: true}), name: 'avatar.png' }] });
	})
		.setUsage('[user]')
		.addAlias('avatar')
		.setDescription('get a user\'s pfp')
		.addClientPermission('ATTACH_FILES'));
}