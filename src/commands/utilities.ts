/* eslint-disable no-fallthrough */
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

	cs.addCommand('utilities', new CommandSystem.SimpleCommand('encode78', (msg, content) => {
		function letterTo78(letter) {
			let code = '';
			let n = letter.charCodeAt(0);
		
			let aAmt = Math.floor(n / 7);
			let aLeftover = n % 7;
			let abAmt = 7 - aLeftover;
		
			code += 'a'.repeat(aAmt);
			if (abAmt > 0) {
				code += 'ab'.repeat(abAmt);
				code += 'a';
			}
			code += 'y';
			return code;
		}
		
		function stringTo78(string) {
			return string.split('').map(s => letterTo78(s)).join('rb\n') + '\nfuck';
		}
		
		return '```78\n' + stringTo78(content) + '```';
	})
		.addExample('hello world!')
		.setUsage('(string)')
		.setDescription('converts a string to a [78 program](https://github.com/oatmealine/78) that outputs that string'));

	cs.addCommand('utilities', new CommandSystem.Command('exec78', (msg, content) => {
		let input = content;

		// memory stuff
		let mainval = 0;
		let bakval = 0;

		let gmult = 0;

		let run = true;
		let cycles = 0;
		const maxCycles = 4000;
		let output = '';

		function runCodePiece(code, loop) {
			const arrlen = code.length;
			
			code.split('').forEach((v, i) => {
				cycles++;

				if (cycles > maxCycles) {
					output = 'Too many cycles';
					throw new Error('Stack overflow');
				}

				if (code[i - 1]) {
					const vp = code[i - 1];
					if (vp === 'h') {
						let cond = mainval > 0;
						if (code[i - 2] === 'k') cond = mainval < 0;
						if (cond) return;
					}
					if (vp === 'j') {
						let cond = mainval === 0;
						if (code[i - 2] === 'k') cond = mainval !== 0;
						if (cond) return;
					}

					if (v !== 'g' && vp === 'g') {
						mainval += Math.round(Math.pow(10, -gmult) * 100) / 100;
						gmult = 0;
					}
				}

				if (code.split('').slice(i, i + 4).join('') === 'fuck') run = false;

				switch(v) {
				case 'a':
					mainval += 7;
					break;
				case 'b':
					mainval -= 8;
					break;
				case 'g':
					gmult++;
					break;
				case 'o':
					output += String(mainval * 2);
					break;
				case 's':
					// eslint-disable-next-line no-case-declarations
					let bak = bakval;
					bakval = mainval;
					mainval = bak;
					break;
				case 'r':
					mainval = 8;
					break;
				case 'y':
					output += String.fromCharCode(mainval);
					break;
				case 'k':
					if (code[i + 1] && (code[i + 1] === 'h' || code[i + 1] === 'j'))
						break;
				case ' ':
				case '\n':
				case 'j':
				case 'u':
				case 'c':
				case 'h':
				case 'f':
					break;
				default:
					output = `${v}: unrecognized instruction`;
					run = false;
					break;
				}

				if (i === arrlen - 1 && loop && mainval !== 0 && run) runCodePiece(code, loop);
			});
		}

		while(run) {
			cycles++;

			if (cycles > maxCycles) {
				output = 'Too many cycles';
				throw new Error('Stack overflow');
			}

			input.split('!').forEach((v, b) => {
				runCodePiece(v, (b % 2) === 1);
			});
		}

		msg.channel.send(`\`${output}\``);
	}));
}