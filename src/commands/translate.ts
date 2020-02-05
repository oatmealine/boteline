import YandexTranslate from 'yet-another-yandex-translate';
import * as Discord from 'discord.js';
import * as util from './util';

const yandex_langs = { 'Afrikaans': 'af', 'Albanian': 'sq', 'Amharic': 'am', 'Arabic': 'ar', 'Armenian': 'hy', 'Azerbaijan': 'az', 'Bashkir': 'ba', 'Basque': 'eu', 'Belarusian': 'be', 'Bengali': 'bn', 'Bosnian': 'bs', 'Bulgarian': 'bg', 'Burmese': 'my', 'Catalan': 'ca', 'Cebuano': 'ceb', 'Chinese': 'zh', 'Croatian': 'hr', 'Czech': 'cs', 'Danish': 'da', 'Dutch': 'nl', 'English': 'en', 'Esperanto': 'eo', 'Estonian': 'et', 'Finnish': 'fi', 'French': 'fr', 'Galician': 'gl', 'Georgian': 'ka', 'German': 'de', 'Greek': 'el', 'Gujarati': 'gu', 'Haitian (Creole)': 'ht', 'Hebrew': 'he', 'Hill Mari': 'mrj', 'Hindi': 'hi', 'Hungarian': 'hu', 'Icelandic': 'is', 'Indonesian': 'id', 'Irish': 'ga', 'Italian': 'it', 'Japanese': 'ja', 'Javanese': 'jv', 'Kannada': 'kn', 'Kazakh': 'kk', 'Khmer': 'km', 'Korean': 'ko', 'Kyrgyz': 'ky', 'Laotian': 'lo', 'Latin': 'la', 'Latvian': 'lv', 'Lithuanian': 'lt', 'Luxembourgish': 'lb', 'Macedonian': 'mk', 'Malagasy': 'mg', 'Malay': 'ms', 'Malayalam': 'ml', 'Maltese': 'mt', 'Maori': 'mi', 'Marathi': 'mr', 'Mari': 'mhr', 'Mongolian': 'mn', 'Nepali': 'ne', 'Norwegian': 'no', 'Papiamento': 'pap', 'Persian': 'fa', 'Polish': 'pl', 'Portuguese': 'pt', 'Punjabi': 'pa', 'Romanian': 'ro', 'Russian': 'ru', 'Scottish': 'gd', 'Serbian': 'sr', 'Sinhala': 'si', 'Slovakian': 'sk', 'Slovenian': 'sl', 'Spanish': 'es', 'Sundanese': 'su', 'Swahili': 'sw', 'Swedish': 'sv', 'Tagalog': 'tl', 'Tajik': 'tg', 'Tamil': 'ta', 'Tatar': 'tt', 'Telugu': 'te', 'Thai': 'th', 'Turkish': 'tr', 'Udmurt': 'udm', 'Ukrainian': 'uk', 'Urdu': 'ur', 'Uzbek': 'uz', 'Vietnamese': 'vi', 'Welsh': 'cy', 'Xhosa': 'xh', 'Yiddish': 'yi' };

// .env stuff
require('dotenv').config();
const prefix = process.env.PREFIX;

// yandex translate api
let yt: YandexTranslate | null;
if (process.env.YANDEXTRANSLATETOKEN) {
	yt = new YandexTranslate(process.env.YANDEXTRANSLATETOKEN);
} else {
	yt = null;
}

export function addCommands(cs) {

	if (yt !== null) {
		cs.addCommand('utilities', new cs.Command('autotranslate', (msg: Discord.Message) => {
			let params = util.getParams(msg);
			let lang = params[0];
			params.shift();

			msg.channel.startTyping();

			yt.translate(params.join(' '), { to: lang, format: 'plain' }).then(translated => {
				let translateEmbed = new Discord.RichEmbed()
					.setDescription(translated)
					.setTitle(`\`${util.shortenStr(params.join(' '), 50).split('\n').join(' ')}\` translated to ${util.objectFlip(yandex_langs)[lang]} will be...`)
					.setFooter('Powered by Yandex.Translate')
					.setColor('#FF0000');
				msg.channel.send('', { embed: translateEmbed });
				msg.channel.stopTyping();
			})
				.catch(err => {
					msg.channel.send('An error occured! `' + err + '`\nThis is likely Yandex.Translate\'s fault, so blame them');
					msg.channel.stopTyping();
				});
		})
			.addClientPermission('EMBED_LINKS')
			.setDescription(prefix + 'translate, but with the first language set to auto')
			.addAlias('atransl')
			.addAlias('atr')
			.setUsage('(string) (string)')
			.setDisplayUsage('(language to translate to) (text, language is autodetected)')
			.addExample('en тестируем ботелине')
			.setGlobalCooldown(500)
			.setUserCooldown(1000));

		cs.addCommand('utilities', new cs.Command('translate', (msg: Discord.Message) => {
			let params = util.getParams(msg);
			let langfrom = params[0];
			let langto = params[1];
			params.splice(0, 2);

			msg.channel.startTyping();

			yt.translate(params.join(' '), { from: langfrom, to: langto, format: 'plain' }).then(translated => {
				let translateEmbed = new Discord.RichEmbed()
					.setDescription(translated)
					.setTitle(`\`${util.shortenStr(params.join(' '), 50).split('\n').join(' ')}\` translated from ${util.objectFlip(yandex_langs)[langfrom]} to ${util.objectFlip(yandex_langs)[langto]} will be...`)
					.setFooter('Powered by Yandex.Translate')
					.setColor('#FF0000');
				msg.channel.send('', { embed: translateEmbed });
				msg.channel.stopTyping();
			})
				.catch(err => {
					msg.channel.send('An error occured! `' + err + '`\nThis is likely Yandex.Translate\'s fault, so blame them');
					msg.channel.stopTyping();
				});
		})
			.addClientPermission('EMBED_LINKS')
			.setDescription('translate some text, get accepted langs list with ' + prefix + 'langs')
			.addAlias('transl')
			.addAlias('tr')
			.setUsage('(string) (string) (string)')
			.setDisplayUsage('(language to translate from) (language to translate to) (text)')
			.addExample('ru en тестируем ботелине')
			.setGlobalCooldown(500)
			.setUserCooldown(1000));

		cs.addCommand('fun', new cs.Command('masstranslate', async (msg: Discord.Message) => {
			let params = util.getParams(msg);
			let times = Number(params[0]);

			if (times > 25) {
				msg.channel.send('count cannot be over 25');
				return;
			}

			let forcelang: string = null;
			let mode: number;
			let cutoff = 2;
			switch (params[1]) {
			case 'curated':
				mode = 0; break;
			case 'normal':
				mode = 1; break;
			case 'auto':
				mode = 2; break;
			case 'hard':
				mode = 3; break;
			default:
				if (Object.values(yandex_langs).includes(params[1])) {
					mode = 4;
					forcelang = params[1];
				} else {
					mode = 0;
					cutoff = 1;
				}
				break;
			case 'legacy':
				mode = 5; break;
			}

			params.splice(0, cutoff);

			// stupid hack . Im sorry in advance
			let progMessage;
			let progUpdateTimeout = 0;
			await msg.channel.send(`getting languages... (mode ${mode})`).then(m => {
				progMessage = m;
			});

			let langCodes = [];
			if (mode === 0) {
				langCodes = ['az', 'mt', 'hy', 'mhr', 'bs', 'cy', 'vi', 'ht', 'ceb', 'gl', 'mrj', 'el', 'da', 'gu', 'su', 'tg', 'th', 'he', 'ga', 'tt', 'tr', 'kk', 'uz', 'ur', 'xh', 'lv', 'lb', 'jv', 'ja'];
			} else if (mode === 5) {
				let langs = await yt.getLangs();

				langs.dirs.forEach(l => {
					l.split('-').forEach(lang => {
						if (!langCodes.includes(lang)) langCodes.push(lang);
					});
				});
			} else {
				langCodes = Object.values(yandex_langs);
			}

			let text = params.join(' ');
			let randLangs = [];
			if (mode === 4) {
				let origlang = await yt.detect(params.join(' '));
				randLangs = Array(times).fill('').map((v, i) => (i % 2 === 0) ? forcelang : origlang);
			} else {
				randLangs = Array(times).fill('').map(() => langCodes[Math.floor(Math.random() * langCodes.length)]);
			}

			for (let i = 0; i < times; i++) {
				let fromLang = randLangs[i - 1];
				if (mode === 2) fromLang = undefined;
				if (mode === 3) fromLang = langCodes[Math.floor(Math.random() * langCodes.length)];

				text = await yt.translate(text, { from: fromLang, to: randLangs[i], format: 'plain' });

				if (progUpdateTimeout < Date.now() - 1000) {
					progMessage.edit(`masstranslating using mode ${mode}... ${i + 1}/${times} \`[${util.progress(i, times, 10)}]\`
${randLangs.map((lang, ind) => (ind === i) ? '**' + lang + '**' : lang).join(', ')}`);
					progUpdateTimeout = Date.now() + 1000;
				}
			}

			progMessage.edit('converting back to english...');
			text = await yt.translate(text, { from: randLangs[times], to: 'en', format: 'plain' });

			let translateEmbed = new Discord.RichEmbed()
				.setDescription(text)
				.setTitle(`\`${util.shortenStr(params.join(' '), 100).split('\n').join(' ')}\` translated ${times} times will be...`)
				.setFooter('Powered by Yandex.Translate, mode ' + mode)
				.setColor('#FF0000');
			progMessage.edit('', { embed: translateEmbed });
		})
			.addClientPermission('EMBED_LINKS')
			.setDescription(`translate a piece of text back and forth a certain amount of times to random languages before translating it back to english. will mostly return gibberish if set to a high value
modes are normal, hard, curated, (langname), legacy`)
			.addAlias('masstransl')
			.addAlias('mtr')
			.setUsage('(number) (string) [string]')
			.setDisplayUsage('(how many times to translate it) [mode] (text, language is autodetected)')
			.addExample('5 this piece of text will likely come out as garbage! but fun garbage at that. try it out!')
			.addExample('5 ja this text will be translated back and forth inbetween english and japanese')
			.setGlobalCooldown(700)
			.setUserCooldown(3000));

		cs.addCommand('utilities', new cs.Command('langs', (msg: Discord.Message) => {
			msg.channel.send('The supported languages for ' + prefix + 'translate are:\n' + Object.keys(yandex_langs).map(k => k + ' (' + yandex_langs[k] + ')').join(', '));
		})
			.setDescription('get the available languages for ' + prefix + 'translate'));
	}
}