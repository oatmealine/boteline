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
	cs.addCommand(new CommandSystem.Command('eval', async (msg, content) => {
		try {
			if (content.startsWith('```')) content = content.split('\n').slice(1, -1).join('\n');

			let evaled = eval(content);

			if (typeof evaled !== 'string') {
				evaled = require('util').inspect(evaled, {depth: 1, maxArrayLength: null});
			}

			evaled = evaled.toString();

			if (evaled.includes(msg.client.token)) {
				return msg.channel.send('Bot token found in result, aborting');
			}

			return util.autoSplit(msg, evaled, 1900, '```xl\n', '```');
		} catch (err) {
			return msg.channel.send(`:warning: \`ERROR\` \`\`\`xl\n${err}\n\`\`\``);
		}
	})
		.setCategory('debug')
		.setOwnerOnly()
		.setUsage('(string)')
		.setDisplayUsage('(code)')
		.setDescription('Execute JS code'));
		
	
	if (pm2 !== null) {
		cs.addCommand(new CommandSystem.Command('restart', msg => {
			msg.react('🆗').then(() => {
				pm2.restart('boteline', () => {});
			});
		})
			.setCategory('debug')
			.setOwnerOnly()
			.setDescription('Restart the bot (only if launched with pm2)')
			.addAlias('reboot'));
	
		cs.addCommand(new CommandSystem.Command('update', async (msg) => {
			await msg.react('⏱️');
			let progMessage = await msg.channel.send('Downloading update...');
			
			exec('git pull', (err, stdout) => {
				if (err) return msg.react('❌');
				
				if (stdout.startsWith('Already up to date.')) return progMessage.edit('No new updates');
				
				progMessage.edit('Installing NPM updates...\n```' + util.shortenStr(stdout, 500) + '```');

				exec('npm install', (err, stdout) => {
					if (err) {
						msg.react('❌');
						progMessage.edit(`\`\`\`${err}\`\`\``);
						return;
					}

					progMessage.edit('Building...\n```' + util.shortenStr(stdout, 500) + '```');
					exec('npm run build', async (err) => {
						if (err) {
							msg.react('❌');
							progMessage.edit(`\`\`\`${err}\`\`\``);
							return;
						}

						await msg.react('☑');
						await progMessage.edit('Done! Restarting...');

						return pm2.restart('boteline', () => {});
					});
				});

				return 'a'; // wow i hate ts
			});
		})
			.setCategory('debug')
			.setOwnerOnly()
			.setDescription('git pull, npm install, npm run build and pm2 restart')
			.addAlias('up'));	
	}

	cs.addCommand(new CommandSystem.Command('exec', (msg, content) => {
		exec(content, (err, stdout) => {
			if (err) {
				if (!msg.content.startsWith(cs.prefix + 's')) msg.channel.send('```' + err + '```');
				msg.react('❌');
			} else {
				msg.react('☑');
				util.autoSplit(msg, stdout, 1900, '```xl\n', '```');
			}
		});
	})
		.setCategory('debug')
		.setOwnerOnly()
		.setDescription('Execute a command prompt command')
		.addAlias('sexec'));

	cs.addCommand(new CommandSystem.Command('paginatortest', (msg) => {
		let paginator = new util.Paginator((count) => {
			return `${count}/${paginator.limit}!!!! Poggers`;
		}, msg.author, [
			{emote: '🖼️', callback: (count) => {paginator.end(); return count;}},
			{emote: '🎐', callback: () => 'Yeah!! penis'}
		]);

		paginator.setLimit(5);
		paginator.start(msg.channel);
	})
		.setHidden());
}