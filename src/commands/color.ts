import * as util from '../lib/util';
import * as Discord from 'discord.js';
import * as cs from '../lib/commandsystem';

Discord; // fuck you ts

export function addCommands(c) {
	c.addCommand('moderating', new cs.SimpleCommand('colorrole', (msg : Discord.Message) => {
		const params = util.getParams(msg);

		const hexRegex = /^#[0-9a-f]{3,6}$/i;
		if (!hexRegex.test(params[0])) return 'not valid hex!';

		let colorRole = msg.guild.roles.cache.find(r => r.name === 'boteline.' + params[0]);
		let userColorRole = msg.member.roles.cache.find(r => r.name.startsWith('boteline.'));

		if (colorRole && userColorRole && colorRole.id === userColorRole.id) return 'you already have this same color role!';

		if (userColorRole) {
			msg.member.roles.remove(userColorRole, 'color role unassigned by the colorrole command')
				.then((member) => {
					let membersWithColorRole = member.guild.members.cache
						.filter(m =>
							m.roles.cache.filter(r => r.id === userColorRole.id).size > 0
						);

					if (membersWithColorRole.size === 0) {
						userColorRole.delete();
					}
				});
		}

		if (colorRole) {
			msg.member.roles.add(colorRole, 'color role assigned by the colorrole command'); // i think its assignRole?? idk have to check
		} else {
			msg.guild.roles.create({
				data: {
					name: 'boteline.' + params[0],
					color: params[0],
					position: 1
				}
			})
				.then(role => {
					msg.member.roles.add(role, 'color role assigned by the colorrole command');
				});
		}

		return 'should have worked';
	})
		.setDescription('sets a color role for you')
		.setUsage('(string)')
		.setDisplayUsage('(hex color)')
		.addAlias('cr')
		.addExample('#f7a8cf')
		.addClientPermissions(['MANAGE_ROLES']));
}