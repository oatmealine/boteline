import * as Discord from 'discord.js';
import { System } from 'cumsystem';

Discord; System; // ts moment

export function run(msg: Discord.Message, cs: System) {
	let guildSettings = cs.get('guildSettings');
	let userData = cs.get('userData');
	let prefix = process.env.PREFIX;
	let logger = cs.get('logger');

	let content: string = msg.content;

	let thisPrefix: string = prefix;

	if (msg.guild) {
		if (guildSettings[msg.guild.id]) {
			thisPrefix = guildSettings[msg.guild.id].prefix;
			if (thisPrefix === undefined) {thisPrefix = prefix;}
		}
	}

	if (!content.startsWith(thisPrefix) && !content.startsWith(prefix)) return;

	if (content.startsWith(thisPrefix)) content = content.slice(thisPrefix.length);
	if (content.startsWith(prefix)) content = content.slice(prefix.length);

	let cmd = content.split(' ')[0];

	logger.debug('got command ' + cmd);

	// check if user is blacklisted
	if (userData[msg.author.id] && userData[msg.author.id].blacklist) {
		let blacklist = userData[msg.author.id].blacklist;
		if (blacklist.includes(cmd) || blacklist.includes('.')) return;
	}

	cs.parseMessage(msg, thisPrefix);
}