import * as util from '../lib/util.js';
import * as Discord from 'discord.js';
import * as CommandSystem from 'cumsystem';

Discord; // fuck you ts

export function addCommands(cs: CommandSystem.System) {
	let userData = cs.get('userData');

	cs.addCommand('moderating', new CommandSystem.SimpleCommand('ban', (msg) => {
		const params = util.getParams(msg);
		const banMember = msg.guild.members.cache.get(util.parseUser(cs.client, params[0], msg.guild).id);

		if (banMember !== undefined) {
			if (banMember.id === msg.author.id) {
				return 'hedgeberg#7337 is now b&. :thumbsup:'; // https://hedgeproofing.tech
			}

			if (banMember.bannable) {
				banMember.ban();
				return '✓ Banned ' + banMember.user.username;
			} else {
				return 'member ' + banMember.user.username + ' isn\'t bannable';
			}
		} else {
			return 'i don\'t know that person!';
		}
	})
		.setUsage('(user)')
		.setDescription('ban a user')
		.addAlias('banuser')
		.addAlias('banmember')
		.addExample('360111651602825216')
		.addClientPermission('BAN_MEMBERS')
		.addUserPermission('BAN_MEMBERS')
		.setGuildOnly());

	cs.addCommand('moderating', new CommandSystem.SimpleCommand('kick', (message) => {
		const params = message.content.split(' ').slice(1, message.content.length);
		const banMember = message.guild.members.cache.get(util.parseUser(cs.client, params[0], message.guild).id);

		if (banMember !== undefined) {
			if (banMember.id === message.member.id) {
				return 'hedgeberg#7337 is now b&. :thumbsup:'; // https://hedgeproofing.tech
			}

			if (banMember.kickable) {
				banMember.ban();
				return '✓ Kicked ' + banMember.user.username;
			} else {
				return 'member ' + banMember.user.username + ' isn\'t kickable';
			}
		} else {
			return 'i don\'t know that person!';
		}
	})
		.setUsage('(user)')
		.addAlias('kickuser')
		.addAlias('kickmember')
		.setDescription('kick a user')
		.addExample('360111651602825216')
		.addClientPermission('KICK_MEMBERS')
		.addUserPermission('KICK_MEMBERS')
		.setGuildOnly());
	
	cs.addCommand('moderating', new CommandSystem.SimpleCommand('blacklistuser', msg => {
		const params = util.getParams(msg);
		let blacklistcmds = [];

		if (params[0] === process.env.OWNER) return 'you can\'t blacklist the owner!';
		if (params[1]) blacklistcmds = params.slice(1);
		if (!userData[params[0]]) userData[params[0]] = {};

		if (blacklistcmds.length > 0) {
			userData[params[0]].blacklist = blacklistcmds;
			if (blacklistcmds.includes('.')) return `ok, blacklisted userid ${params[0]} from any commands`;
			return `ok, blacklisted userid ${params[0]} from accessing commands \`${blacklistcmds.join(', ')}\``;
		} else {
			userData[params[0]].blacklist = [];
			return `ok, removed blacklist from userid ${params[0]}`;
		}
	})
		.addExample('209765088196821012 .')
		.addExample('209765088196821012 translate autotranslate masstranslate')
		.setOwnerOnly()
		.setDescription('prevent a user from accessing commands (set to . for all commands, provide no second argument for remove)')
		.setUsage('(number) [string]')
		.setDisplayUsage('(userid) [command]..'));
}