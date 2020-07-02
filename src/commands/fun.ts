import * as CommandSystem from 'cumsystem';
import * as Discord from 'discord.js';
import * as parse5 from 'parse5';
import * as util from '../lib/util';
const got = require('got');

export function addCommands(cs: CommandSystem.System) {
	cs.addCommand(new CommandSystem.Command('robloxad', async (msg) => {
		let url = 'https://www.roblox.com/user-sponsorship/' + (Math.floor(Math.random() * 3) + 1);
		let document = await got(url);

		let parsedDocument = parse5.parse(document.body);

		// @ts-ignore
		let attrs = parsedDocument.childNodes[1].childNodes[2].childNodes[1].childNodes[1].attrs;
		// @ts-ignore
		let link = parsedDocument.childNodes[1].childNodes[2].childNodes[1].attrs[2].value;

		let embed = new Discord.MessageEmbed()
			.setTitle(attrs[1].value)
			.setURL(link)
			.setImage(attrs[0].value)
			.setDescription(`ads fetched from [here](${url})`);

		return msg.channel.send(embed);
	})
		.setCategory('fun')
		.setDescription('fetch a roblox ad')
		.addClientPermissions(['EMBED_LINKS', 'ATTACH_FILES'])
		.setGlobalCooldown(300));

	cs.addCommand(new CommandSystem.SimpleCommand('kva', () => {
		return 'ква ква ква  гав гав гав    мяяяяяу   беееее  муууу  ку ку';
	})
		.setCategory('fun')
		.setHidden()
		.addAlias('ква')
		.setDescription('ква'));
		
	cs.addCommand(new CommandSystem.Command('eat', (msg) => {
		const params = util.getParams(msg);
		
		const eat = cs.client.emojis.cache.get('612360473928663040').toString();
		const hamger1 = cs.client.emojis.cache.get('612360474293567500').toString();
		const hamger2 = cs.client.emojis.cache.get('612360473987252278').toString();
		const hamger3 = cs.client.emojis.cache.get('612360473974931458').toString();
		
		const insideHamger: string = params[0] ? params.join(' ') : hamger2;
		
		msg.channel.send(eat + hamger1 + insideHamger + hamger3).then((m) => {
			if (m instanceof Discord.Message)
				cs.client.setTimeout(() => {
					m.edit(eat + insideHamger + hamger3).then((m) => {
						cs.client.setTimeout(() => {
							m.edit(eat + hamger3).then((m) => {
								cs.client.setTimeout(() => {
									m.edit(eat).then((m) => {
										cs.client.setTimeout(() => {
											m.delete();
										}, 2000);
									});
								}, 1000);
							});
						}, 1000);
					});
				}, 1000);
		});
	})
		.setCategory('fun')
		.setDescription('eat the Burger')
		.setUsage('[any]')
		.addAlias('burger')
		.addClientPermission('USE_EXTERNAL_EMOJIS'));
		
	cs.addCommand(new CommandSystem.SimpleCommand('rate', (msg) => {
		const params = util.getParams(msg);
		let thingToRate = params.join(' ').toLowerCase().split(' ').join('');
		
		if (thingToRate.startsWith('me') || thingToRate.startsWith('my')) {
			// rate the user, not the string
			thingToRate += util.hashCode(msg.author.id);
		} else if (thingToRate.startsWith('thisserver') || thingToRate.startsWith('thisdiscord')) {
			// rate the server, not the string
			thingToRate += util.hashCode(msg.guild.id);
		}
		
		const rating = util.seedAndRate(thingToRate);
		
		return `I'd give ${params.join(' ').replace('me', 'you').replace('my', 'your')} a **${rating}/10**`;
	})
		.setCategory('fun')
		.setDescription('rates something')
		.setUsage('(string)')
		.addExample('me'));
		
	cs.addCommand(new CommandSystem.SimpleCommand('pick', (msg) => {
		const params = util.getParams(msg);
		
		let thingToRate1: string = params[0].toLowerCase();
		let thingToRate2: string = params[1].toLowerCase();
		
		if (thingToRate1.startsWith('me') || thingToRate1.startsWith('my')) {
			thingToRate1 = thingToRate1 + util.hashCode(msg.author.id);
		} else if (thingToRate1.startsWith('thisserver') || thingToRate1.startsWith('thisdiscord')) {
			thingToRate1 = thingToRate1 + util.hashCode(msg.guild.id);
		}
		
		if (thingToRate2.startsWith('me') || thingToRate2.toLowerCase().startsWith('my')) {
			thingToRate2 = thingToRate2 + util.hashCode(msg.author.id);
		} else if (thingToRate2.startsWith('thisserver') || thingToRate2.startsWith('thisdiscord')) {
			thingToRate2 = thingToRate2 + util.hashCode(msg.guild.id);
		}
		
		const rating1 = util.seedAndRate(thingToRate1);
		const rating2 = util.seedAndRate(thingToRate2);
		return `Out of ${params[0]} and ${params[1]}, I'd pick **${rating1 === rating2 ? 'neither' : (rating1 > rating2 ? thingToRate1 : thingToRate2)}**`;
	})
		.setCategory('fun')
		.addAlias('choose')
		.setDescription('rates 2 objects, and picks one of them')
		.setUsage('(string) (string)')
		.addExample('njs python'));
		
	cs.addCommand(new CommandSystem.SimpleCommand('ask', (msg) => {
		const params = util.getParams(msg);
		const thingToRate = params.join(' ').toLowerCase();
		const options = ['ohh fuck yea', 'yes', 'maybe', 'no', 'god no'];
		let rating = Math.round((1 - util.normalDistribution((Math.abs(util.hashCode(thingToRate)) / 10) % 2 - 1)) / 2 * 8);
		
		return `> ${params.join(' ')}\n${options[rating]}`;
	})
		.setCategory('fun')
		.setDescription('ask the bot a question')
		.setUsage('(string)')
		.addAlias('askquestion')
		.addAlias('question')
		.addExample('is this a good example'));

	cs.addCommand(new CommandSystem.SimpleCommand('isgay', (msg) => {
		let params = util.getParams(msg);
		let ratingThing = params.join(' ').toLowerCase();

		const transOverride = ['duck', 'oatmealine', 'oat', 'jill', 'ladizi', 'lavie', 'arceus', 'leah', 'skye'];
		const enbyOverride = ['jude'];
		const gayOverride = ['discord', 'oat', 'jill', 'oatmealine', 'ur mom', 'skye', 'duck'];
		const biOverride = [];
		const aceOverride = ['catte'];

		let ratedHash = util.hashCode(ratingThing);
		let ratedHashUpper = util.hashCode(ratingThing.toUpperCase());

		let isGay = (ratedHash % 3) === 0 || gayOverride.includes(ratingThing);
		let isBi = (ratedHashUpper % 4) === 0 || biOverride.includes(ratingThing);
		let isAce = (ratedHash % 16) === 0 || aceOverride.includes(ratingThing);
		let isTrans = ((ratedHashUpper % 5) === 0) || transOverride.includes(ratingThing);
		let isEnby = ((ratedHashUpper % 10) === 0) || enbyOverride.includes(ratingThing);

		let sexuality = '';
		if (isGay) sexuality = 'gay';
		if (isBi) sexuality = 'bi';
		if (isAce) sexuality = 'asexual';

		return `**${params.join(' ')}** is ${sexuality !== '' ? sexuality : (isTrans || isEnby ? '' : 'not gay')}${(sexuality !== '' && (isTrans || isEnby)) ? ' and ' : ''}${(isTrans || isEnby ? (isEnby ? 'non-binary' : 'trans') : '')}!`;
	})
		.setCategory('fun')
		.addAlias('istrans')
		.addAlias('isenby')
		.addAlias('isbi')
		.setDescription('check if something is lgbtq or not and which part it is')
		.addExample('jill')
		.setUsage('(string)')
		.setDisplayUsage('(thing to test)'));

	cs.addCommand(new CommandSystem.Command('inspirobot', msg => {
		msg.channel.startTyping();
	
		got('http://inspirobot.me/api?generate=true')
			.then(res => {
				if (res && res.statusCode == 200) {
					msg.channel.send({files: [res.body]}).then(() => {
						msg.channel.stopTyping();
					});
				}
			});
	})
		.setCategory('fun')
		.addClientPermission('ATTACH_FILES')
		.setGlobalCooldown(1000)
		.setDescription('fetch an inspiring ai-generated quote from [inspirobot](http://inspirobot.me/)')
		.addAlias('insp'));

	cs.addCommand(new CommandSystem.Command('hi', msg => {
		msg.channel.send('', {files: ['assets/hi.png']});
	})
		.setCategory('fun')
		.setDescription('hi')
		.setHidden());

	// listen, i coded this on a fucking phone in discord and this temporary command is now a permanent command
	// the only reason its formatted properly is because eslint was screaming at me
	cs.addCommand(new CommandSystem.SimpleCommand('notlights', async (msg, content) => {
		let params = content.split(' ');

		let agents = ['Black Mesa Security PC', 'GUCCI SmartToilet', 'Twitter for Android', 'Samsung SmartToaster', 'de boa', 'NotITG Browser', 'Tabletop Simulator Tablet', 'iPod Touch 4', 'FBI Research Facility', 'usa.gov', 'Air', 'NGINX', 'BotNite', 'if u see this ure gay', 'TV Remote', 'Nintendo 3DS Browser', 'Nintendo Wii U Browser', 'Samsung SmartMicrowave', 'Australia Government PC', 'Nintendo Switch 2', 'the', 'undefined', 'null', 'NaN', 'The Pentagon', 'jill\'s mouse', 'big chungus', 'the chinese government', 'Internet Explorer 6.0', 'iPhone 3GP Safari'];
		let userAgent = `${agents[Math.floor(Math.random() * agents.length)]} (https://github.com/oatmealine/boteline, command ran by ${msg.author.username}#${msg.author.discriminator}${params[5] ? `. They said: "${params.slice(5).join(' ')}"` : ''})`;

		let response = await got(`https://soulja-boy-told.me/light?r=${params[0]}&g=${params[1]}&b=${params[2]}&bri=${params[3]}&on=${params[4]}`, {headers: {'user-agent': userAgent}});
		
		msg.react('✅');
		return `sent with useragent \`${userAgent}\`\nr: ${params[0]} g: ${params[1]} b: ${params[2]} brightness: ${params[3]} on: ${(params[4] === 'true') ? 'yes' : 'no'}\nresponse:\n\`\`\`\n${response.body}\`\`\``;
	})
		.setCategory('fun')
		.setDescription('Control the Not Nite Lights.')
		.setHidden()
		.addAlias('notnitelights')
		.setUsage('(number) (number) (number) (number) (string) [string]')
		.setDisplayUsage('(r) (g) (b) (brightness) (on true/false) [comment]'));

	cs.addCommand(new CommandSystem.Command('jok', (msg) => {
		got('https://icanhazdadjoke.com/', {headers: {'Accept': 'application/json', 'user-agent': 'https://github.com/oatmealine/boteline/'}}).then(res => {
			let joke = JSON.parse(res.body);
		 
			let jokeParts = joke.joke.split(/[?.!]/);
			msg.channel.send(jokeParts[0].toLowerCase());
		});
	})
		.setDescription('yoooooo joke with no punchline')
		.setCategory('fun'));

	cs.addCommand(new CommandSystem.Command('oke', (msg) => {
		got('https://icanhazdadjoke.com/', {headers: {'Accept': 'application/json', 'user-agent': 'https://github.com/oatmealine/boteline/'}}).then(res => {
			let joke = JSON.parse(res.body);
	 
			let jokeParts = joke.joke.split(/[?.!]/);
			msg.channel.send(jokeParts.slice(-2)[0].toLowerCase());
		});
	})
		.setDescription('yoooooo joke with no buildup')
		.setCategory('fun'));

	cs.addCommand(new CommandSystem.SimpleCommand('thiscompanydoesnotexist', () => {
		// this code is terrible becuase it was a challenge to myself to make code without if's
		// sorry
		
		// name
		let words = require('an-array-of-english-words');

		words = words.filter(w => w.length < 6);

		let word1 = words[Math.floor(Math.random() * words.length)];
		let word1capitalized = Math.random() > 0.4;
		let word2 = words[Math.floor(Math.random() * words.length)];
		let word2capitalized = Math.random() > 0.5;

		let twoWords = word1.length < 5 && Math.random() > 0.5;

		let name = `${word1capitalized ? word1.split('').map((v,i) => (i === 0) ? v.toUpperCase() : v.toLowerCase()).join('') : word1}${twoWords ? (word2capitalized ? word2.split('').map((v,i) => (i === 0) ? v.toUpperCase() : v.toLowerCase()).join('') : word2) : ''}`;

		// logo
		let bordersLeft = ['\\', '/', '|', ':', '.', '-', '[', ']', '(', ')', '\''];
		let bordersRight = ['/', '\\', '|', ':', '.', '-', ']', '[', ')', '(', '\''];

		let hasBorder = Math.random() > 0.1;
		let borderSymmetrical = Math.random() > 0.1;

		let borderNum = Math.floor(Math.random() * bordersLeft.length);

		let hasUnderline = Math.random() > 0.1;
		let underlineMiddle = Math.random() > 0.3;

		let middlePatterns = [':', '-', '=', '', 'l', 'o', '_', name[0].toUpperCase(), '*' + name[0].toLowerCase() + '*'];
		let doublePattern = Math.random() > 0.6;
		let doublePatternSymmetrical = Math.random() > 0.1;

		let middlePattern1 = middlePatterns[Math.floor(Math.random() * middlePatterns.length)].repeat(Math.floor(Math.random() * 2 + 1));
		let middlePattern2 = middlePatterns[Math.floor(Math.random() * middlePatterns.length)];

		let middlePattern = `${middlePattern1}${doublePattern ? middlePattern2 : ''}${(doublePattern && doublePatternSymmetrical) ? middlePattern1 : ''}`;
		let leftBorder = `${hasBorder ? bordersLeft[borderNum] : ''}`;
		let rightBorder = `${hasBorder ? (borderSymmetrical ? bordersRight[borderNum] : bordersLeft[borderNum]) : ''}`;

		let logo = `${(hasUnderline && !underlineMiddle) ? '__' : ''}${leftBorder}${(hasUnderline && underlineMiddle) ? '__' : ''}${middlePattern}${(hasUnderline && underlineMiddle) ? '__' : ''}${rightBorder}${(hasUnderline && !underlineMiddle) ? '__' : ''}`;

		// put together
		return `${logo} ${name}`.split('\\').join('\\\\'); // discord un-fuckuper
	})
		.setDescription('a generic 2020 company name + logo generator')
		.setCategory('fun'));
}