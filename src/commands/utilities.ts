/* eslint-disable no-fallthrough */
import * as CommandSystem from 'cumsystem';
// eslint-disable-next-line no-unused-vars
import * as Discord from 'discord.js';
import * as util from '../lib/util';

const got = require('got');

async function shadertoyEmbed(id: string): Promise<Discord.MessageEmbed> {
	let resp = await got(`https://www.shadertoy.com/api/v1/shaders/${id}?key=${process.env.SHADERTOYKEY}`);
	let data = JSON.parse(resp.body).Shader;

	if (!data || data.Error) return null;
	let embed = new Discord.MessageEmbed()
		.setTitle(data.info.name)
		.setAuthor(data.info.username)
		.setThumbnail(`https://www.shadertoy.com/media/shaders/${id}.jpg`)
		.setDescription(data.info.description + '\nTags: ' + data.info.tags.map(t => `\`${t}\``).join(', ')) // this is terrible i know
		.addField('Views', data.info.viewed.toLocaleString(), true)
		.addField('Likes', data.info.likes.toLocaleString(), true)
		.setTimestamp(new Date(Number(data.info.date) * 1000))
		.setURL(`https://www.shadertoy.com/view/${id}`);

	return embed;
}

export function addCommands(cs: CommandSystem.System) {
	cs.addCommand(new CommandSystem.Command('icon', (message) => {
		message.channel.send({ files: [{ attachment: message.guild.iconURL, name: 'icon.png' }] });
	})
		.setCategory('utilities')
		.addAlias('servericon')
		.addAlias('serverpic')
		.setDescription('get the server\'s icon')
		.addClientPermission('ATTACH_FILES')
		.setGuildOnly());

	cs.addCommand(new CommandSystem.Command('pfp', (msg) => {
		const params = util.getParams(msg);
		let user: Discord.User;

		if (params[0] !== undefined) {
			user = util.parseUser(cs.client, params[0], msg.guild);
		} else {
			user = msg.author;
		}
		msg.channel.send('', { files: [{ attachment: user.displayAvatarURL({dynamic: true}), name: 'avatar.png' }] });
	})
		.setCategory('utilities')
		.setUsage('[user]')
		.addAlias('avatar')
		.setDescription('get a user\'s pfp')
		.addClientPermission('ATTACH_FILES'));

	cs.addCommand(new CommandSystem.SimpleCommand('encode78', (msg, content) => {
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
		.setCategory('utilities')
		.addExample('hello world!')
		.setUsage('(string)')
		.setDescription('converts a string to a [78 program](https://github.com/oatmealine/78) that outputs that string'));

	cs.addCommand(new CommandSystem.Command('exec78', (msg, content) => {
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
	})
		.setCategory('utilities')
		.addExample('a o fuck')
		.setUsage('(string)')
		.setDisplayUsage('(code)')
		.setDescription('a limited interpreter of [78](https://github.com/oatmealine/78)'));

	cs.addCommand(new CommandSystem.SimpleCommand('define', async (msg, content) => {
		try {
			let def;

			if (content === '') {
				let defs = await got(`https://api.wordnik.com/v4/words.json/wordOfTheDay?api_key=${process.env.WORDNIK_KEY}`);
				def = JSON.parse(defs.body);

				def.text = def.definitions[0].text;
				def.partOfSpeech = def.definitions[0].partOfSpeech;
				if (!def.exampleUses) def.exampleUses = [];
			} else {
				let defs = await got(`https://api.wordnik.com/v4/word.json/${encodeURI(content)}/definitions?limit=200&includeRelated=false&sourceDictionaries=all&useCanonical=true&includeTags=false&api_key=${process.env.WORDNIK_KEY}`);
				let defsObj = JSON.parse(defs.body);

				def = defsObj.filter(d => d.text).sort(() => Math.random() - 0.5).sort((a, b) => b.score - a.score)[0];
			}

			let embed = new Discord.MessageEmbed()
				.setTitle(`${def.word} *${def.partOfSpeech}*`)
				.setURL(def.attributionUrl)
				.setDescription(def.text)
				.setFooter(def.attributionText);

			if (def.exampleUses.length > 0)
				embed.addField('Examples', def.exampleUses.map(e => '> ' + e.text).join('\n'));

			return embed;
		} catch(err) {
			return `Error: \`${err}\``;
		}
	})
		.setCategory('dictionary')
		.setDescription('get the definition of a word')
		.setUsage('[string]')
		.setDisplayUsage('[word]'));

	cs.addCommand(new CommandSystem.SimpleCommand('pronounce', async (msg, content) => {
		try {
			let pronouns = await got(`https://api.wordnik.com/v4/word.json/${encodeURI(content)}/audio?useCanonical=false&limit=50&api_key=${process.env.WORDNIK_KEY}`);
			let pronounsObj = JSON.parse(pronouns.body);

			let pronoun = pronounsObj.sort(() => Math.random() - 0.5)[0];

			return {files: [pronoun.fileUrl]};
		} catch(err) {
			return `Error: \`${err}\``;
		}
	})
		.setCategory('dictionary')
		.setDescription('get the pronounciation for a word')
		.setUsage('(string)')
		.setDisplayUsage('(word)'));

	// shadertoy shenanigans
	cs.client.on('message', async (msg) => {
		let shadertoyRegex = /https?:\/\/(www\.)?shadertoy\.com\/view\/\w{6}/;
		let match = msg.content.match(shadertoyRegex);

		if (match) {
			let embed = await shadertoyEmbed(match[0].split('/').pop());
			if (embed) msg.channel.send(embed);
		}
	});

	cs.addCommand(new CommandSystem.SimpleCommand('shadertoy', async (msg, content) => {
		let resp = await got(`https://www.shadertoy.com/api/v1/shaders/query/${encodeURI(content)}?key=${process.env.SHADERTOYKEY}`);
		let data = JSON.parse(resp.body);

		if (data.Shaders < 1 || !data.Results) {
			return 'No shaders found';
		} else {
			return shadertoyEmbed(data.Results[0]);
		}
	})
		.setUsage('(string)')
		.setDisplayUsage('(search)')
		.setGlobalCooldown(1000)
		.setCategory('utilities'));
}