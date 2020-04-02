import * as CommandSystem from 'cumsystem';
import * as util from '../lib/util';
import {exec} from 'child_process';


// hardcoded, but cant do anything about it
let pm2;

try {
	pm2 = require('pm2');
	pm2.connect(function (err){
		if (err) throw err;
	});
} catch (err) {
	pm2 = null;
}

export function addCommands(cs: CommandSystem.System) {
	cs.addCommand('debug', new CommandSystem.Command('eval', (msg, content) => {
		try {
			let evaled = eval(content);

			if (typeof evaled !== 'string') {
				evaled = require('util').inspect(evaled, {depth: 1, maxArrayLength: null});
			}

			evaled = evaled.toString();

			if (evaled.includes(msg.client.token)) {
				return msg.channel.send('Bot token found in result, aborting');
			}

			const embed = {
				title: 'Eval',
				color: '990000',
				fields: [{
					name: 'Input',
					value: '```xl\n' + util.shortenStr(content, 1000) + '\n```',
					inline: true,
				},
				{
					name: 'Output',
					value: '```xl\n' + util.shortenStr(evaled, 1000) + '\n```',
					inline: true,
				},
				],
			};

			if (!msg.content.startsWith(cs.prefix + 's')) msg.channel.send('', { embed });
			return msg.react('☑');
		} catch (err) {
			return msg.channel.send(`:warning: \`ERROR\` \`\`\`xl\n${err}\n\`\`\``);
		}
	})
		.setOwnerOnly()
		.setUsage('(string)')
		.setDisplayUsage('(code)')
		.setDescription('Execute JS code')
		.addAliases(['eval', 'sdebug', 'seval']));
		
	
	if (pm2 !== null) {
		cs.addCommand('debug', new CommandSystem.Command('restart', msg => {
			if (pm2 !== null) {
				msg.react('🆗').then(() => {
					pm2.restart('boteline', () => {});
				});
			}
		})
			.setOwnerOnly()
			.setDescription('Restart the bot (only if launched with pm2)')
			.addAlias('reboot'));
	}

	cs.addCommand('debug', new CommandSystem.Command('exec', (msg, content) => {
		exec(content, (err, stdout) => {
			if (err) {
				if (!msg.content.startsWith(cs.prefix + 's')) msg.channel.send('```' + err + '```');
				msg.react('❌');
			} else {
				if (!msg.content.startsWith(cs.prefix + 's')) msg.channel.send('```' + stdout + '```');
				msg.react('☑');
			}
		});
	})
		.setOwnerOnly()
		.setDescription('Execute a command prompt command')
		.addAlias('sexec'));
}