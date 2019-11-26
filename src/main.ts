// libraries & modules
import * as Discord from 'discord.js';
const bot = new Discord.Client({
  messageCacheMaxSize: 400,
  messageCacheLifetime: 600,
  messageSweepInterval: 100,
  disableEveryone: true,
  disabledEvents: ['RESUMED',
    'GUILD_BAN_ADD',
    'GUILD_BAN_REMOVE',
    'VOICE_STATE_UPDATE',
    'TYPING_START',
    'VOICE_SERVER_UPDATE',
    'RELATIONSHIP_ADD',
    'RELATIONSHIP_REMOVE',
    'WEBHOOKS_UPDATE'
  ]
});

import * as cs from './commandsystem.js';

import * as foxConsole from './foxconsole.js';

import * as util from './util.js';

import {exec} from 'child_process';
import * as fs from 'fs';

import * as os from 'os';

import { createCanvas, loadImage } from 'canvas';

import * as ffmpeg from 'fluent-ffmpeg';
import YandexTranslate from 'yet-another-yandex-translate';
const yandex_langs = { "Azerbaijan": "az", "Malayalam": "ml", "Albanian": "sq", "Maltese": "mt", "Amharic": "am", "Macedonian": "mk", "English": "en", "Maori": "mi", "Arabic": "ar", "Marathi": "mr", "Armenian": "hy", "Mari": "mhr", "Afrikaans": "af", "Mongolian": "mn", "Basque": "eu", "German": "de", "Bashkir": "ba", "Nepali": "ne", "Belarusian": "be", "Norwegian": "no", "Bengali": "bn", "Punjabi": "pa", "Burmese": "my", "Papiamento": "pap", "Bulgarian": "bg", "Persian": "fa", "Bosnian": "bs", "Polish": "pl", "Welsh": "cy", "Portuguese": "pt", "Hungarian": "hu", "Romanian": "ro", "Vietnamese": "vi", "Russian": "ru", "Haitian_(Creole)": "ht", "Cebuano": "ceb", "Galician": "gl", "Serbian": "sr", "Dutch": "nl", "Sinhala": "si", "Hill_Mari": "mrj", "Slovakian": "sk", "Greek": "el", "Slovenian": "sl", "Georgian": "ka", "Swahili": "sw", "Gujarati": "gu", "Sundanese": "su", "Danish": "da", "Tajik": "tg", "Hebrew": "he", "Thai": "th", "Yiddish": "yi", "Tagalog": "tl", "Indonesian": "id", "Tamil": "ta", "Irish": "ga", "Tatar": "tt", "Italian": "it", "Telugu": "te", "Icelandic": "is", "Turkish": "tr", "Spanish": "es", "Udmurt": "udm", "Kazakh": "kk", "Uzbek": "uz", "Kannada": "kn", "Ukrainian": "uk", "Catalan": "ca", "Urdu": "ur", "Kyrgyz": "ky", "Finnish": "fi", "Chinese": "zh", "French": "fr", "Korean": "ko", "Hindi": "hi", "Xhosa": "xh", "Croatian": "hr", "Khmer": "km", "Czech": "cs", "Laotian": "lo", "Swedish": "sv", "Latin": "la", "Scottish": "gd", "Latvian": "lv", "Estonian": "et", "Lithuanian": "lt", "Esperanto": "eo", "Luxembourgish": "lb", "Javanese": "jv", "Malagasy": "mg", "Japanese": "ja", "Malay": "ms" }

const ch = require('chalk');
// files

const packageJson = JSON.parse(fs.readFileSync('./package.json', {encoding: 'utf8'}));
const packageLock = JSON.parse(fs.readFileSync('./package-lock.json', {encoding: 'utf8'}));

if (!fs.existsSync('./data/userdata.json')) {
  fs.writeFileSync('./data/userdata.json', '{}');
}
const userData = JSON.parse(fs.readFileSync('./data/userdata.json', {encoding: 'utf8'}));

if (!fs.existsSync('./data/guildsettings.json')) {
  fs.writeFileSync('./data/guildsettings.json', '{}');
}
const guildSettings = JSON.parse(fs.readFileSync('./data/guildsettings.json', {encoding: 'utf8'}));

const valhallaDrinks = JSON.parse(fs.readFileSync('./src/valhalla.json', {encoding: 'utf8'}));

// .env stuff
require('dotenv').config();
foxConsole.showDebug(process.env.DEBUG == 'true');

// constants & variables
const prefix : string = process.env.PREFIX;
cs.setPrefix(prefix);

const version : string = packageJson.version + ' alpha';

let application: Discord.OAuth2Application;

// statistics

let cpuUsageMin: number = 0;
let cpuUsage30sec: number = 0;
let cpuUsage1sec: number = 0;

let cpuUsageMinOld = process.cpuUsage();
let cpuUsage30secOld = process.cpuUsage();
let cpuUsage1secOld = process.cpuUsage();

setInterval(() => {
  const usage = process.cpuUsage(cpuUsage1secOld);
  cpuUsage1sec = 100 * (usage.user + usage.system) / 1000000;
  cpuUsage1secOld = process.cpuUsage();
}, 1000);
setInterval(() => {
  const usage = process.cpuUsage(cpuUsage30secOld);
  cpuUsage30sec = 100 * (usage.user + usage.system) / 30000000;
  cpuUsage30secOld = process.cpuUsage();
}, 30000);
setInterval(() => {
  const usage = process.cpuUsage(cpuUsageMinOld);
  cpuUsageMin = 100 * (usage.user + usage.system) / 60000000;
  cpuUsageMinOld = process.cpuUsage();
}, 60000);

class FFMpegCommand extends cs.Command {
	public inputOptions: Function
	public outputOptions: Function

	constructor(name : string, inputOptions, outputOptions) {
	  super(name, null);

	  this.inputOptions = inputOptions;
	  this.outputOptions = outputOptions;

	  this.function = async (msg) => {
	    const params = util.getParams(msg);
	    const attachments = [];

	    if (msg.attachments.size === 0) {
	      await msg.channel.fetchMessages({limit: 20}).then((msges) => {
	        msges.array().forEach((m : Discord.Message) => {
	          if (m.attachments.size > 0) {
	            m.attachments.array().forEach((att) => {
	              attachments.push(att);
	            });
	          }
	        });
	      });
	    } else {
	      attachments.push(msg.attachments.first());
	    }

	    if (attachments.length > 0) {
	      let videoAttach : Discord.MessageAttachment;

	      attachments.forEach((attachment) => {
	        if (videoAttach || !attachment) { return; }

	        const filetype = attachment.filename.split('.').pop();
	        const acceptedFiletypes = ['apng', 'webm', 'swf', 'wmv', 'mp4', 'flv', 'm4a'];

	        if (acceptedFiletypes.includes(filetype.toLowerCase())) {
	          videoAttach = attachment;
	        }
	      });

	      if (videoAttach) {
	        let progMessage : Discord.Message;
	        let lastEdit = 0; // to avoid ratelimiting

	        msg.channel.send('ok, downloading...').then((m) => {
	          progMessage = m;
	        });
	        msg.channel.startTyping();

	        if (params[0]) {
	          if (params[0].startsWith('.') || params[0].startsWith('/') || params[0].startsWith('~')) {
	            if (progMessage) {
	              progMessage.edit('i know exactly what you\'re doing there bud');
	            } else {
	              msg.channel.send('i know exactly what you\'re doing there bud');
	            }
	          }
	        }

	        ffmpeg(videoAttach.url)
	          .inputOptions(this.inputOptions(msg))
	          .outputOptions(this.outputOptions(msg))
	          .on('start', (commandLine) => {
	            foxConsole.info('started ffmpeg with command: ' + commandLine);
	            if (progMessage) {
	              progMessage.edit('processing: 0% (0s) done');
	            }
	          })
	          .on('stderr', (stderrLine) => {
	            foxConsole.debug('ffmpeg: ' + stderrLine);
	          })
	          .on('progress', (progress) => {
	            if (lastEdit + 2000 < Date.now() && progMessage) {
	              lastEdit = Date.now();
	              progMessage.edit(`processing: **${progress.percent !== undefined ? Math.floor(progress.percent * 100) / 100 : '0.00'}%** \`(${progress.timemark})\``);
	            }
	          })
	          .on('error', (err) => {
	            msg.channel.stopTyping();
	            foxConsole.warning('ffmpeg failed!');
	            foxConsole.warning(err);
	            if (progMessage) {
	              progMessage.edit(`processing: error! \`${err}\``);
	            } else {
	              msg.channel.send(`An error has occured!: \`${err}\``);
	            }
	          })
	          .on('end', () => {
	            msg.channel.stopTyping();
	            if (progMessage) {
	              progMessage.edit('processing: done! uploading');
	            }
	            msg.channel.send('ok, done', {files: ['./temp/temp.mp4']}).then(() => {
	              if (progMessage) {
	                progMessage.delete();
	              }
	            });
	          })
	        // .pipe(stream);
	          .save('./temp/temp.mp4');
	      } else {
	        msg.channel.send('No video attachments found');
	      }
	    } else {
	      msg.channel.send('No attachments found');
	    }
	  };
	  return this;
	}
}

class CanvasGradientApplyCommand extends cs.Command {
  public gradient : string[];
  public bottomstring : string;

  constructor(name : string, gradient : string[], bottomstring : string) {
	  super(name, null);

    this.bottomstring = bottomstring;
    this.gradient = gradient;
    
    this.addClientPermission('ATTACH_FILES');
    this.setUsage('[user]');

	  this.function = (msg : Discord.Message) => {
      msg.channel.startTyping();
      let params = util.getParams(msg);

      const canvas = createCanvas(300, 390);
      const ctx = canvas.getContext('2d');
      
      let user = params.length === 0 ? msg.author : util.parseUser(bot, params[0], msg.guild);
      
      if (user === null) {
        msg.channel.send('User not found');
        return;
      }

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, 300, 390);
      
      ctx.font = '30px Impact';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center'; 
      ctx.fillText(user.username + ' is ' + bottomstring, 150, 340 + 15);
        
      loadImage(user.displayAvatarURL).then((image) => {
        ctx.drawImage(image, 10, 10, 280, 280);

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, 280, 280);
      
        let ctxGradient = ctx.createLinearGradient(0, 10, 0, 290);

        gradient.forEach((clr,i,arr) => {
          ctxGradient.addColorStop(i / (arr.length - 1), clr);
        });
        
        ctx.fillStyle = ctxGradient;
      
        ctx.fillRect(10,10,280,280);
        
        msg.channel.send('', {files: [canvas.toBuffer()]}).then(() => {
          msg.channel.stopTyping();
        });
      });
	  };
	  return this;
  }
}

console.log(ch.red.bold(`boteline v${version}`));
if (process.env.DEBUG) { console.debug(ch.grey('debug printing on')); }

// i KNOW this is messy but like ,,, how else would you do this
console.log(ch.bold(`

   ${ch.bgRed('              ')}
 ${ch.bgRed('                  ')}
 ${ch.bgRed('        ')}${ch.bgYellow('        ')}${ch.bgRed('  ')}
 ${ch.bgRed('      ')}${ch.white.bgYellow('  ██    ██')}${ch.bgRed('  ')}
   ${ch.bgRed('    ')}${ch.bgYellow('          ')}
     ${ch.bgRed('  ')}${ch.bgGreen('        ')}
       ${ch.bgWhite('  ')}    ${ch.bgWhite('  ')}

`));
foxConsole.info('adding commands...');

// yandex translate api
let yt : YandexTranslate | null;
if (process.env.YANDEXTRANSLATETOKEN) {
  yt = new YandexTranslate(process.env.YANDEXTRANSLATETOKEN);
} else {
  yt = null;
}

cs.addCommand('core', new cs.SimpleCommand('invite', () => {
  return `Invite me here: <https://discordapp.com/oauth2/authorize?client_id=${application.id}&scope=bot&permissions=314432>`;
})
  .setDescription('get the bot\'s invite')
  .addAlias('invitelink'));

cs.addCommand('moderating', new cs.SimpleCommand('ban', (message) => {
  const params = util.getParams(message);
  const banMember = message.guild.members.get(util.parseUser(bot, params[0], message.guild).id);

  if (banMember !== undefined) {
    if (banMember.id === message.user.id) {
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

cs.addCommand('moderating', new cs.SimpleCommand('kick', (message) => {
  const params = message.content.split(' ').slice(1, message.content.length);
  const banMember = message.guild.members.get(util.parseUser(bot, params[0], message.guild).id);

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

cs.addCommand('utilities', new cs.SimpleCommand('fahrenheit', (message) => {
  const params = util.getParams(message);
  return `${params[0]}°C is **${Math.round(((Number(params[0]) * 9 / 5) + 32) * 100) / 100}°F**`;
})
  .addAliases(['farenheit', 'farenheight', 'fairenheight', 'fairenheit', 'fahrenheight', 'americancelcius', 'stupidunit', 'notcelsius', 'notcelcius', 'weirdformulaunit', 'multiplyby1.8andadd32'])
  .setUsage('(number)')
  .setDescription('convert celsius to fahrenheit')
  .addExample('15'));

cs.addCommand('utilities', new cs.SimpleCommand('celsius', (message) => {
  const params = util.getParams(message);
  return `${params[0]}°F is **${Math.round(((Number(params[0]) - 32) * 5 / 9) * 100) / 100}°C**`;
})
  .setUsage('(number)')
  .addAlias('celcius')
  .setDescription('convert fahrenheit to celsius')
  .addExample('59'));

cs.addCommand('utilities', new cs.SimpleCommand('kelvin', (message) => {
  const params = util.getParams(message);
  return `${params[0]}°C is ${Number(params[0]) < -273.15 ? `**physically impossible** ~~(buut would be **${Math.round((Number(params[0]) + 273.15) * 100) / 100}K**)~~` : `**${Math.round((Number(params[0]) + 273.15) * 100) / 100}K**`}`;
})
  .setUsage('(number)')
  .setDescription('convert celsius to kelvin')
  .addExample('15'));

cs.addCommand('utilities', new cs.SimpleCommand('mbs', (message) => {
  const params = util.getParams(message);
  return `${params[0]}Mbps is **${Math.round((Number(params[0])) / 8 * 100) / 100}MB/s**`;
})
  .setUsage('(number)')
  .addAlias('mb/s')
  .setDescription('convert mbps to mb/s')
  .addExample('8'));

cs.addCommand('utilities', new cs.SimpleCommand('mbps', (message) => {
  const params = util.getParams(message);
  return `${params[0]}MB/s is **${Math.round((Number(params[0])) * 800) / 100}Mbps**`;
})
  .setUsage('(number)')
  .setDescription('convert mb/s to mbps')
  .addExample('1'));

cs.addCommand('utilities', new cs.Command('icon', (message) => {
  message.channel.send('', { files: [{ attachment: message.guild.iconURL, name: 'icon.png' }] });
})
  .addAlias('servericon')
  .addAlias('serverpic')
  .setDescription('get the server\'s icon')
  .addClientPermission('ATTACH_FILES')
  .setGuildOnly());

cs.addCommand('utilities', new cs.Command('pfp', (msg) => {
  const params = util.getParams(msg);
  let user: Discord.User;

  if (params[0] !== undefined) {
    user = util.parseUser(bot, params[0], msg.guild);
  } else {
    user = msg.author;
  }
  msg.channel.send('', { files: [{ attachment: user.displayAvatarURL, name: 'avatar.png' }] });
})
  .setUsage('[user]')
  .addAlias('avatar')
  .setDescription('get a user\'s pfp')
  .addClientPermission('ATTACH_FILES'));

cs.addCommand('fun', new cs.SimpleCommand('kva', () => {
  return 'ква ква ква  гав гав гав    мяяяяяу   беееее  муууу  ку ку';
})
  .setHidden()
  .addAlias('ква')
  .setDescription('ква'));

cs.addCommand('fun', new FFMpegCommand('compress', () => [], (msg) => {
  const params = util.getParams(msg);
  if (!params[0]) { params[0] = '20'; }
  return [`-b:v ${Math.abs(Number(params[0]))}k`, `-b:a ${Math.abs(Number(params[0]) - 3)}k`, '-c:a aac'];
})
  .setDescription('compresses a video')
  .addAlias('compression')
  .setUsage('[number]')
  .addClientPermission('ATTACH_FILES')
  .setGlobalCooldown(1000)
  .setUserCooldown(5000));

cs.addCommand('fun', new cs.Command('eat', (msg) => {
  const params = util.getParams(msg);

  const eat = bot.emojis.get('612360473928663040').toString();
  const hamger1 = bot.emojis.get('612360474293567500').toString();
  const hamger2 = bot.emojis.get('612360473987252278').toString();
  const hamger3 = bot.emojis.get('612360473974931458').toString();

  const insideHamger: string = params[0] ? params.join(' ') : hamger2;

  msg.channel.send(eat + hamger1 + insideHamger + hamger3).then((m) => {
    bot.setTimeout(() => {
      m.edit(eat + insideHamger + hamger3).then((m) => {
        bot.setTimeout(() => {
          m.edit(eat + hamger3).then((m) => {
            bot.setTimeout(() => {
              m.edit(eat).then((m) => {
                bot.setTimeout(() => {
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
  .setDescription('eat the Burger')
  .setUsage('[any]')
  .addAlias('burger')
  .addClientPermission('USE_EXTERNAL_EMOJIS'));

cs.addCommand('fun', new cs.Command('valhalla', (msg) => {
  const params = util.getParams(msg);

  if (params[0] === 'search') {
    const foundDrinks: any[] = [];
    const search = params.slice(1, params.length).join(' ');

    valhallaDrinks.forEach((d) => {
      if (d.name.toLowerCase().includes(search.toLowerCase()) || d.flavour.toLowerCase() === search.toLowerCase()) {
        foundDrinks.push(d);
      } else {
        d.type.forEach((f) => {
          if (search.toLowerCase() === f.toLowerCase()) {
            foundDrinks.push(d);
          }
        });
      }
    });

    if (foundDrinks.length < 1) {
      msg.channel.send(`Found no matches for \`${params[1]}\``);
    } else if (foundDrinks.length === 1) {
      msg.channel.send('', util.makeDrinkEmbed(foundDrinks[0]));
    } else {
      let founddrinksstr = '\n';
      foundDrinks.slice(0, 5).forEach((d) => {
        founddrinksstr = founddrinksstr + '**' + d.name + '**\n';
      });
      if (foundDrinks.length > 5) {
        founddrinksstr = founddrinksstr + `..and ${foundDrinks.length - 5} more drinks`;
      }

      msg.channel.send(`Found ${foundDrinks.length} drinks:\n${founddrinksstr}`);
    }
  } else if (params[0] === 'make') {
    let adelhyde = 0;
    let bronsonExtract = 0;
    let powderedDelta = 0;
    let flangerine = 0;
    let karmotrine = 0;

    let blended = false;
    let aged = false;
    let iced = false;

    params[1].split('').forEach((i) => {
      switch (i) {
      case 'a':
        adelhyde += 1;
        break;
      case 'b':
        bronsonExtract += 1;
        break;
      case 'p':
        powderedDelta += 1;
        break;
      case 'f':
        flangerine += 1;
        break;
      case 'k':
        karmotrine += 1;
      }
    });

    blended = params.includes('blended');
    iced = params.includes('ice');
    aged = params.includes('aged');

    foxConsole.debug(`${adelhyde}, ${bronsonExtract}, ${powderedDelta}, ${flangerine}, ${karmotrine}`);
    foxConsole.debug(`${blended}, ${aged}, ${iced}`);

    let drink: boolean;
    let drinkBig: boolean;

    valhallaDrinks.forEach((d) => {
      if (adelhyde + bronsonExtract + powderedDelta + flangerine + karmotrine > 20) { return; }

      drinkBig = adelhyde / 2 === d.ingredients.adelhyde
					&& bronsonExtract / 2 === d.ingredients.bronson_extract
					&& powderedDelta / 2 === d.ingredients.powdered_delta
					&& flangerine / 2 === d.ingredients.flangerine
					&& (karmotrine / 2 === d.ingredients.karmotrine || d.ingredients.karmotrine === 'optional');

      if (adelhyde !== d.ingredients.adelhyde && (adelhyde / 2 !== d.ingredients.adelhyde || !drinkBig)) { return; }
      if (bronsonExtract !== d.ingredients.bronson_extract && (bronsonExtract / 2 !== d.ingredients.bronson_extract || !drinkBig)) { return; }
      if (powderedDelta !== d.ingredients.powdered_delta && (powderedDelta / 2 !== d.ingredients.powdered_delta || !drinkBig)) { return; }
      if (flangerine !== d.ingredients.flangerine && (flangerine / 2 !== d.ingredients.flangerine || !drinkBig)) { return; }
      if ((karmotrine !== d.ingredients.karmotrine && (karmotrine / 2 !== d.ingredients.karmotrine || !drinkBig)) && d.ingredients.karmotrine !== 'optional') { return; }

      if (blended !== d.blended) { return; }
      if (aged !== d.aged) { return; }
      if (iced !== d.iced) { return; }

      drink = d;
    });

    msg.channel.send(':timer: **Making drink...**').then((editmsg) => {
      bot.setTimeout(() => {
        if (drink === undefined) {
          editmsg.edit('Failed to make drink!');
        } else {
          editmsg.edit('Successfully made drink!' + (drinkBig ? ' (its big too, woah)' : ''), util.makeDrinkEmbed(drink));
        }
      }, blended ? 7000 : 3000);
    });
  }
})
  .addAlias('va11halla')
  .setUsage('(string) (string) [string] [string] [string]')
  .setDisplayUsage('valhalla ((search) (drink name) | (make) (ingredients marked by their first letter) [mixed?] [on the rocks?] [aged?])')
  .addExample('search Frothy Water')
  .addExample('make abpf aged')
  .addExample('make aabbbbppffffkkkkkkkk')
  .setDescription('search up drinks, and make some drinks, va11halla style!\nbasically a text-based replica of the drink making part of va11halla'));

cs.addCommand('fun', new cs.SimpleCommand('nwordpass', (msg) => {
  const params = util.getParams(msg);

  if (params[0] === 'toggle') {
    userData[msg.author.id].nworddisable = !userData[msg.author.id].nworddisable;
    return `the system is now **${userData[msg.author.id].nworddisable ? 'OFF' : 'ON'}**`;
  } else {
    return `You have:
	**${userData[msg.author.id].nwordpasses}** N-Word passes [**${userData[msg.author.id].nworddisable ? 'OFF' : 'ON'}**] (Use m=nwordpass toggle to disable/enable)
	You are: **\`[${util.progress(userData[msg.author.id].nwordpassxp, userData[msg.author.id].nwordpassxpneeded)}]\`** this close to getting another N-Word pass`;
  }
})
  .addAlias('nword')
  .addAlias('nwordpasses')
  .setDescription('see your amount of nwordpasses, or toggle the system')
  .setUsage('[toggle]')
  .addExample('toggle'));

cs.addCommand('fun', new cs.SimpleCommand('rate', (msg) => {
  const params = util.getParams(msg);
  let thingToRate = params.join(' ');

  if (thingToRate.toLowerCase().startsWith('me') || thingToRate.toLowerCase().startsWith('my')) {
    // rate the user, not the string
    thingToRate += util.hashCode(msg.author.id.toString());
  } else if (thingToRate.toLowerCase().startsWith('this server') || thingToRate.toLowerCase().startsWith('this discord')) {
    // rate the server, not the string
    thingToRate = thingToRate + util.hashCode(msg.guild.id.toString());
  }
  const rating = util.seedAndRate(thingToRate.toLowerCase().split(' ').join(''));
  return `I'd give ${params.join(' ')} a **${rating}/10**`;
})
  .setDescription('rates something')
  .setUsage('(string)')
  .addExample('me'));

cs.addCommand('fun', new cs.SimpleCommand('pick', (msg) => {
  const params = util.getParams(msg);

  let thingToRate1: string = params[0];
  let thingToRate2: string = params[1];

  if (thingToRate1.toLowerCase().startsWith('me') || thingToRate1.toLowerCase().startsWith('my')) {
    thingToRate1 = thingToRate1 + util.hashCode(msg.author.id.toString());
  } else if (thingToRate1.toLowerCase().startsWith('this server') || thingToRate1.toLowerCase().startsWith('this discord')) {
    thingToRate1 = thingToRate1 + util.hashCode(msg.guild.id.toString());
  }

  if (thingToRate2.toLowerCase().startsWith('me') || thingToRate2.toLowerCase().startsWith('my')) {
    thingToRate2 = thingToRate2 + util.hashCode(msg.author.id.toString());
  } else if (thingToRate2.toLowerCase().startsWith('this server') || thingToRate2.toLowerCase().startsWith('this discord')) {
    thingToRate2 = thingToRate2 + util.hashCode(msg.guild.id.toString());
  }

  const rating1 = util.seedAndRate(thingToRate1.toLowerCase().split(' ').join(''));
  const rating2 = util.seedAndRate(thingToRate2.toLowerCase().split(' ').join(''));
  return `Out of ${params[0]} and ${params[1]}, I'd pick **${rating1 === rating2 ? 'neither' : (rating1 > rating2 ? thingToRate1 : thingToRate2)}**`;
})
  .addAlias('choose')
  .setDescription('rates 2 objects, and picks one of them')
  .setUsage('(string) (string)')
  .addExample('njs python'));

cs.addCommand('fun', new cs.SimpleCommand('ask', (msg) => {
  const thingToRate = util.getParams(msg).join(' ');
  return `> ${thingToRate}\nI'd say, **${['yes', 'probably', 'maybe', 'no'][Math.abs(util.hashCode(thingToRate)) * 23 % 4]}**`;
})
  .setDescription('ask the bot a question')
  .setUsage('(string)')
  .addAlias('askquestion')
  .addAlias('question')
  .addExample('is this a good example'));

cs.addCommand('fun', new cs.Command('achievement', (msg) => {
  const params = util.getParams(msg);
  msg.channel.send('', { files: [{ attachment: 'https://minecraftskinstealer.com/achievement/1/Achievement+Get%21/' + encodeURI(params.join('+')), name: 'achievement.png' }] });
})
  .addAlias('advancement')
  .setDescription('make a minecraft achievement')
  .setUsage('(string)')
  .addExample('Made an example!')
  .addClientPermission('ATTACH_FILES'));

cs.addCommand('debug', new cs.SimpleCommand('permtest', () => {
  return 'yay, it worked!';
})
  .setHidden()
  .setGuildOnly()
  .setDebugOnly()
  .addUserPermission('MANAGE_MESSAGES')
  .addClientPermissions(['MANAGE_MESSAGES', 'BAN_MEMBERS'])
  .addAlias('permtestingalias'));

cs.addCommand('core', new cs.Command('info', (msg) => {
  msg.channel.send(new Discord.RichEmbed()
    .setFooter(`Made using Node.JS ${process.version}, TypeScript ${packageLock.dependencies['typescript'].version}, Discord.JS v${packageLock.dependencies['discord.js'].version}`, bot.user.displayAvatarURL)
    .setTitle(`${bot.user.username} stats`)
    .setURL(packageJson.repository)
    .setDescription(`Currently in ${bot.guilds.size} servers, with ${bot.channels.size} channels and ${bot.users.size} users`)
    .addField('Memory Usage', Math.round(process.memoryUsage().rss / 10000) / 100 + 'MB', true)
    .addField('CPU Usage', `Last second: **${util.roundNumber(cpuUsage1sec, 3)}%**\nLast 30 seconds: **${util.roundNumber(cpuUsage30sec, 3)}%**\nLast minute: **${util.roundNumber(cpuUsageMin, 3)}%**\nRuntime: **${util.roundNumber(process.cpuUsage().user / (process.uptime() * 1000), 3)}%**`, true)
    .addField('Uptime', `${Math.round(process.uptime() / 76800)}d ${Math.round(process.uptime() / 3200)%24}h ${Math.round(process.uptime() / 60)%60}m ${Math.round(process.uptime())%60}s`, true));
})
  .addAlias('stats')
  .setDescription('get some info and stats about the bot'));

cs.addCommand('core', new cs.Command('hoststats', (msg) => {
  msg.channel.send(new Discord.RichEmbed()
    .setFooter(`Running on ${os.platform}/${os.type()} (${os.arch()})`)
    .setTitle(`Host's stats - ${os.hostname()}`)
    .setDescription('Stats for the bot\'s host')
    .addField('Uptime', `${Math.round(os.uptime() / 76800)}d ${Math.round(os.uptime() / 3200)%24}h ${Math.round(os.uptime() / 60)%60}m ${Math.round(os.uptime())%60}s`, true)
    .addField('Memory', `${util.roundNumber((os.totalmem()-os.freemem())/1000000, 3)}MB/${util.roundNumber(os.totalmem()/1000000, 3)}MB used`, true)
    .addField('CPU', `${os.cpus()[0].model}`, true));
})
  .addAliases(['matstatsfoxedition', 'oatstats', 'host', 'neofetch'])
  .setDescription('get some info and stats about the bot'));

cs.addCommand('core', new cs.SimpleCommand('prefix', (msg) => {
  const params = util.getParams(msg);
  if (!params[0]) { params[0] = prefix; }

  params[0] = params[0].toLowerCase();

  if (guildSettings[msg.guild.id]) {
    guildSettings[msg.guild.id] = params[0];
  } else {
    guildSettings[msg.guild.id] = {
      prefix: params[0],
    };
  }

  return `changed prefix to ${params[0]}`;
})
  .addAlias('setprefix')
  .addAlias('customprefix')
  .setDescription('set a custom prefix for boteline')
  .setUsage('[string]')
  .addUserPermission('MANAGE_GUILD'));

cs.addCommand('utilities', new cs.Command('splatoon', (msg) => {
  util.checkSplatoon().then(obj => {
    let data = obj.data;

    let timeLeft = Math.floor(data.league[0].end_time-Date.now()/1000);

    const regularemote = bot.emojis.get('639188039503183907') !== undefined ? bot.emojis.get('639188039503183907').toString()+' ' : '';
    const rankedemote = bot.emojis.get('639188039658242078') !== undefined ? bot.emojis.get('639188039658242078').toString()+' ' : '';
    const leagueemote = bot.emojis.get('639188038089703452') !== undefined ? bot.emojis.get('639188038089703452').toString()+' ' : '';

    let embed = new Discord.RichEmbed()
      .setTitle('Splatoon 2 Map Schedules')
      .addField(regularemote+'Regular Battle',
        `${data.regular[0].stage_a.name}, ${data.regular[0].stage_b.name}
		${data.regular[0].rule.name}`)
      .addField(rankedemote+'Ranked Battle',
        `${data.gachi[0].stage_a.name}, ${data.gachi[0].stage_b.name}
		${data.gachi[0].rule.name}`)
      .addField(leagueemote+'League Battle',
        `${data.league[0].stage_a.name}, ${data.league[0].stage_b.name}
		${data.league[0].rule.name}`)
      .setColor('22FF22')
      .setDescription(`${util.formatTime(new Date(data.league[0].start_time*1000))} - ${util.formatTime(new Date(data.league[0].end_time*1000))}
		${Math.floor(timeLeft/60/60)%24}h ${Math.floor(timeLeft/60)%60}m ${timeLeft%60}s left`)
      .setURL('https://splatoon2.ink/')
      .setImage('https://splatoon2.ink/assets/splatnet'+data.regular[0].stage_a.image)
      .setFooter('Data last fetched '+obj.timer.toDateString()+', '+util.formatTime(obj.timer) + ' - Data provided by splatoon2.ink');

    msg.channel.send('', embed);
  });
})
  .addAlias('splatoonschedule')
  .addAlias('splatoon2')
  .setDescription('Check the schedule of the Splatoon 2 stage rotations')
  .addClientPermission('EMBED_LINKS'));

cs.addCommand('utilities', new cs.Command('salmonrun', (msg) => {
  util.checkSalmon().then(obj => {
    let data = obj.data;

    let timeLeftEnd = Math.floor(data.details[0].end_time-Date.now()/1000);
    let timeLeftStart = Math.floor(data.details[0].start_time-Date.now()/1000);

    let weapons = [];
    data.details[0].weapons.forEach(w => {
      weapons.push(w.weapon.name);
    });

    let embed = new Discord.RichEmbed()
      .setTitle('Splatoon 2 Salmon Run Schedule')
      .addField('Weapons',
        `${weapons.join(', ')}`)
      .addField('Map',
        `${data.details[0].stage.name}`)
      .setColor('FF9922')
      .setDescription(`${new Date(data.details[0].start_time*1000).toUTCString()} - ${new Date(data.details[0].end_time*1000).toUTCString()}
		${timeLeftStart < 0 ? `${Math.floor(timeLeftEnd/60/60)%24}h ${Math.floor(timeLeftEnd/60)%60}m ${timeLeftEnd%60}s left until end` : `${Math.floor(timeLeftStart/60/60)%24}h ${Math.floor(timeLeftStart/60)%60}m ${timeLeftStart%60}s left until start`}`)
      .setURL('https://splatoon2.ink/')
      .setImage('https://splatoon2.ink/assets/splatnet'+data.details[0].stage.image)
      .setFooter('Data last fetched '+obj.timer.toDateString()+', '+util.formatTime(obj.timer) + ' - Data provided by splatoon2.ink');

    msg.channel.send('', embed);
  });
})
  .addAlias('salmon')
  .addAlias('salmonschedule')
  .setDescription('Check the schedule of the Splatoon 2 Salmon Run stage/weapon rotations')
  .addClientPermission('EMBED_LINKS'));

cs.addCommand('fun', new cs.SimpleCommand('isgay', (msg) => {
  let params = util.getParams(msg);
  let ratingThing = params.join(' ').toLowerCase();

  const transOverride = ['duck', 'oatmealine', 'oat', 'jill', 'ladizi', 'lavie', 'arceus', 'leah'];
  const enbyOverride = ['jude'];
  const gayOverride = ['discord', 'oat', 'jill', 'oatmealine', 'ur mom'];
  const biOverride = [];
  const aceOverride = ['catte'];

  let ratedHash = util.hashCode(params.join(' ').toLowerCase());
  let ratedHashUpper = util.hashCode(params.join(' ').toUpperCase());

  let isGay = (ratedHash % 3) === 0 || gayOverride.includes(ratingThing);
  let isBi = (ratedHashUpper % 4) === 0 || biOverride.includes(ratingThing);
  let isAce = (ratedHash % 16) === 0 || aceOverride.includes(ratingThing);
  let isTrans = ((ratedHashUpper % 5) === 0) || transOverride.includes(ratingThing);
  let isEnby = ((ratedHashUpper % 10) === 0) || enbyOverride.includes(ratingThing);

  let sexuality = '';
  if (isGay) sexuality = 'gay';
  if (isBi) sexuality = 'bi';
  if (isAce) sexuality = 'asexual';

  return `**${ratingThing}** is ${sexuality !== '' ? sexuality : (isTrans || isEnby ? '' : 'not gay')}${(sexuality !== '' && (isTrans || isEnby)) ? ' and ' : ''}${(isTrans || isEnby ? (isEnby ? 'non-binary' : 'trans') : '')}!`;
})
  .addAlias('istrans')
  .addAlias('isenby')
  .addAlias('isbi')
  .setDescription('check if something is lgbtq or not and which part it is')
  .addExample('jill')
  .setUsage('(string)')
  .setDisplayUsage('(thing to test)'));

cs.addCommand('image', new CanvasGradientApplyCommand('gay',
  ['rgba(255,0,0,0.5)',
    'rgba(255,127,0,0.5)',
    'rgba(255,255,0,0.5)',
    'rgba(0,255,0,0.5)',
    'rgba(0,255,255,0.5)',
    'rgba(0,0,255,0.5)',
    'rgba(255,0,255,0.5)'],
  'GAY')
  .setDescription('puts a gay flag over your (or someone else\'s) icon')
  .addAlias('gayoverlay')
  .setGlobalCooldown(100)
  .setUserCooldown(1000));

cs.addCommand('image', new CanvasGradientApplyCommand('trans',
  ['rgba(85,205,252,0.6)',
    'rgba(247,168,184,0.6)',
    'rgba(255,255,255,0.6)',
    'rgba(247,168,184,0.6)',
    'rgba(85,205,252,0.6)'],
  'TRANS')
  .setDescription('puts a trans flag over your (or someone else\'s) icon')
  .addAlias('transoverlay')
  .setGlobalCooldown(100)
  .setUserCooldown(1000));

cs.addCommand('image', new CanvasGradientApplyCommand('bi',
  ['rgba(214,2,112,0.6)',
    'rgba(214,2,112,0.6)',
    'rgba(155,79,150,0.6)',
    'rgba(0,56,168,0.6)',
    'rgba(0,56,168,0.6)'],
  'BI')
  .setDescription('puts a bi flag over your (or someone else\'s) icon')
  .addAlias('bioverlay')
  .setGlobalCooldown(100)
  .setUserCooldown(1000));

if (yt !== null) {
  cs.addCommand('utilities', new cs.Command('autotranslate', (msg : Discord.Message) => {
    let params = util.getParams(msg);
    let lang = params[0];
    params.shift();

    msg.channel.startTyping();

    yt.translate(params.join(' '), {to: lang, format: 'plain'}).then(translated => {
      let translateEmbed = new Discord.RichEmbed()
        .setDescription(translated)
        .setTitle(`${util.shortenStr(params.join(' '), 50)} translated to ${lang} will be...`)
        .setFooter('Powered by Yandex.Translate')
        .setColor('#FF0000');
      msg.channel.send('', {embed: translateEmbed});
      msg.channel.stopTyping();
    })
      .catch(err => {
        msg.channel.send('An error occured! `'+err+'`\nThis is likely Yandex.Translate\'s fault, so blame them');
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

  cs.addCommand('utilities', new cs.Command('translate', (msg : Discord.Message) => {
    let params = util.getParams(msg);
    let langfrom = params[0];
    let langto = params[1];
    params.splice(0, 2);

    msg.channel.startTyping();

    yt.translate(params.join(' '), {from: langfrom, to: langto, format: 'plain'}).then(translated => {
      let translateEmbed = new Discord.RichEmbed()
        .setDescription(translated)
        .setTitle(`${util.shortenStr(params.join(' '), 50)} translated from ${langfrom} to ${langto} will be...`)
        .setFooter('Powered by Yandex.Translate')
        .setColor('#FF0000');
      msg.channel.send('', {embed: translateEmbed});
      msg.channel.stopTyping();
    })
      .catch(err => {
        msg.channel.send('An error occured! `'+err+'`\nThis is likely Yandex.Translate\'s fault, so blame them');
        msg.channel.stopTyping();
      });
  })
    .addClientPermission('EMBED_LINKS')
    .setDescription('translate some text, get accepted langs list with '+prefix+'langs')
    .addAlias('transl')
    .addAlias('tr')
    .setUsage('(string) (string) (string)')
    .setDisplayUsage('(language to translate from) (language to translate to) (text)')
    .addExample('ru en тестируем ботелине')
    .setGlobalCooldown(500)
    .setUserCooldown(1000));

  cs.addCommand('utilities', new cs.Command('masstranslate', async (msg : Discord.Message) => {
    let params = util.getParams(msg);
    let times = Number(params[0]);

    if (times > 25) {
      msg.channel.send('count cannot be over 25');
      return;
    }

    let forcelang : string = null;
    let mode : number;
    switch(params[1]) {
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
          params[2] = params[1] + params[2];
        }
        break;
      case 'legacy':
        mode = 5; break;
    }

    params.splice(0, 2);

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
      randLangs = Array(times).fill('').map((v,i) => (i%2 === 0) ? forcelang : origlang);
    } else {
      randLangs = Array(times).fill('').map(() => langCodes[Math.floor(Math.random()*langCodes.length)]);
    }
    
    for(let i = 0; i < times; i++) {
      let fromLang = randLangs[i-1];
      if (mode === 2) fromLang = undefined;
      if (mode === 3) fromLang = langCodes[Math.floor(Math.random()*langCodes.length)];

      text = await yt.translate(text, {from: fromLang, to: randLangs[i], format: 'plain'});

      if (progUpdateTimeout < Date.now() - 1000) {
        progMessage.edit(`masstranslating using mode ${mode}... ${i+1}/${times} \`[${util.progress(i, times, 10)}]\`
${randLangs.map((lang, ind) => (ind === i) ? '**' + lang + '**' : lang).join(', ')}`);
        progUpdateTimeout = Date.now() + 1000;
      }
    }

    progMessage.edit('converting back to english...');
    text = await yt.translate(text, {from: randLangs[times], to: 'en', format: 'plain'});

    let translateEmbed = new Discord.RichEmbed()
      .setDescription(text)
      .setTitle(`\`${util.shortenStr(text, 50)}\` translated ${times} will be...`)
      .setFooter('Powered by Yandex.Translate, mode '+mode)
      .setColor('#FF0000');
    progMessage.edit('', {embed: translateEmbed});
  })
    .addClientPermission('EMBED_LINKS')
    .setDescription(`translate a piece of text back and forth a certain amount of times to random languages before translating it back to english. will mostly return gibberish if set to a high value
normal mode - a regular mode, does what youd expect this command to do
hard - the language that text is translated from is randomized. ex. instead of en -> es, es -> ru its en -> es, tt -> ru
curated - the language list is curated to only have the most ridiculous results
(langname) - translates text back and forth to one specific language (see examples)
legacy - uses old language list`)
    .addAlias('masstransl')
    .addAlias('mtr')
    .setUsage('(number) (string) [string]')
    .setDisplayUsage('(how many times to translate it) [mode - normal, hard, auto, curated, (langname) or legacy] (text, language is autodetected)')
    .addExample('5 this piece of text will likely come out as garbage! but fun garbage at that. try it out!')
    .addExample('5 ja this text will be translated back and forth inbetween english and japanese')
    .setGlobalCooldown(700)
    .setUserCooldown(3000));

  cs.addCommand('utilities', new cs.Command('langs', (msg : Discord.Message) => {
    yt.getLangs().then(langs => {
      msg.channel.send('The supported languages for '+prefix+'translate are:\n`' + Object.values(yandex_langs).join('`, `') + '`');
    });
  })
    .setDescription('get the available languages for '+prefix+'translate'));
}

cs.addCommand('core', new cs.Command('listdependencies', (msg) => {
  let dependencyEmbed = new Discord.RichEmbed()
    .setTitle('Boteline Dependencies')
    .setColor('#FFFF00')
    .setDescription('Dependencies taken from package.json, dependency versions taken from package-lock.json');
  
  Object.keys(packageJson.dependencies).forEach((dependency : string) => {
    if (!dependency.startsWith('@') && packageLock.dependencies[dependency] !== undefined) dependencyEmbed.addField(dependency, packageLock.dependencies[dependency].version, true);
  });

  msg.channel.send('', {embed: dependencyEmbed});
})
  .addAlias('dependencies')
  .addAlias('depends')
  .addClientPermission('EMBED_LINKS')
  .setDescription('list the dependencies boteline uses, and their versions'));

foxConsole.info('starting...');

bot.on('message', (msg) => {
  let content: string = msg.content;
  const author: Discord.User = msg.author;

  if (userData[author.id] === undefined) {
    userData[author.id] = {
      nwordpasses: 1,
      nwordpassxp: 0,
      nwordpassxpneeded: 100,
      nextpass: 0,
      nworddisable: true,
    };
  }
  if (!userData[author.id].nworddisable && !content.startsWith(prefix)) {
    // patch for old accounts
    if (!userData[author.id].nwordpassxpneeded) {
      userData[author.id].nwordpassxpneeded = 100 + userData[author.id].nwordpasses * 50;
    }

    const count: number = (msg.content.toLowerCase().replace(' ', '').match(/nigg/g) || []).length;

    if (count === 0 && Date.now() > userData[author.id].nextpass) {
      userData[author.id].nwordpassxp += Math.floor(Math.random() * 10 + 5);
      userData[author.id].nextpass = Date.now() + 120000;

      if (userData[author.id].nwordpassxp > userData[author.id].nwordpassxpneeded) {
        userData[author.id].nwordpassxp -= 100;
        userData[author.id].nwordpasses += 1;
        userData[author.id].nwordpassxpneeded = 100 + userData[author.id].nwordpasses * 50;
        msg.channel.send(`**${author.username}#${author.discriminator}** recieved an N-Word pass!`);
      }
    } else {
      if (count > userData[author.id].nwordpasses) {
        if (msg.deletable) { msg.delete(); }
        msg.reply('you don\'t have enough N-Word passes!');
      } else if (count !== 0) {
        userData[author.id].nwordpasses -= count;
        msg.channel.send(`:bangbang: ${msg.author.toString()} used ${count} N-Word ${count === 1 ? 'pass' : 'passes'}`);
        userData[author.id].nwordpassxpneeded = 100 + userData[author.id].nwordpasses * 50;
      }
    }
  }

  let thisPrefix: string = prefix;

  if (msg.guild) {
    if (guildSettings[msg.guild.id]) {
      thisPrefix = guildSettings[msg.guild.id].prefix;
    }
  }

  if (content.startsWith(thisPrefix) || content.startsWith(prefix)) {
    content = content.slice(content.startsWith(thisPrefix) ? thisPrefix.length : prefix.length, content.length);
    const cmd = content.split(' ')[0];

    foxConsole.debug('got command ' + cmd);

    Object.values(cs.commands).forEach((cat) => {
      Object.values(cat).forEach((command) => {
        if ((command['name'] === cmd || command['aliases'].includes(cmd)) && 
				((msg.content.startsWith(thisPrefix) || (msg.content.startsWith(prefix) && command['ignorePrefix'])) || (thisPrefix == prefix)) && 
				(!command['debugOnly'] || process.env.DEBUG == 'true')) {
          command['runCommand'](msg, bot);
        }
      }); 
    });

    // debug and owneronly commands
    // not put into commandsystem for debugging if the system dies or something like that
		
    let clean = function(text) {
      if (typeof (text) === 'string') {
        text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
        return text;
      } else {
        return text;
      }
    };

    if (author.id === process.env.OWNER) {
      switch (cmd) {
      case 'debug':
        try {
          const code = content.replace(cmd + ' ', '');
          let evaled = eval(code);

          if (typeof evaled !== 'string') {
            evaled = require('util').inspect(evaled);
          }

          const embed = {
            title: 'Eval',
            color: '990000',
            fields: [{
              name: 'Input',
              value: '```xl\n' + code + '\n```',
              inline: true,
            },
            {
              name: 'Output',
              value: '```xl\n' + clean(evaled) + '\n```',
              inline: true,
            },
            ],
          };

          msg.channel.send('', { embed });
          msg.react('☑');
        } catch (err) {
          msg.channel.send(`:warning: \`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
        }
        break;
      case 'exec':
        exec(content.replace(cmd + ' ', ''), (err, stdout) => {
          if (err) {
            msg.channel.send('```' + err + '```');
          } else {
            msg.channel.send('```' + stdout + '```');
          }
        });
      }
    }
  }
});

bot.on('ready', () => {
  foxConsole.info('fetching application...');
  bot.fetchApplication().then((app) => {
    application = app;
  });

  foxConsole.info('doing post-login intervals...');

  const presences: [string, Discord.ActivityType][] = [['Celeste', 'PLAYING'], ['Celeste OST', 'LISTENING'], ['you', 'WATCHING'], ['sleep', 'PLAYING'], [`try ${process.env.PREFIX}help`, 'PLAYING'], [`Boteline v${version}`, 'STREAMING']];

  bot.setInterval(() => {
    presences.push([`${bot.guilds.size} servers`, 'WATCHING']);
    presences.push([`with ${bot.users.size} users`, 'PLAYING']);

    const presence : [string, Discord.ActivityType] = presences[Math.floor(Math.random() * presences.length)];
    bot.user.setPresence({ status: 'dnd', game: { name: presence[0], type: presence[1] } });

    foxConsole.debug(`changed presence to [${presence}]`);
  }, 30000);

  bot.setInterval(() => {
    foxConsole.debug('saving userdata...');
    fs.writeFile('./data/userdata.json', JSON.stringify(userData), (err) => {
      if (err) {
        foxConsole.error('failed saving userdata: ' + err);
      } else {
        foxConsole.success('saved userdata');
      }
    });

    foxConsole.debug('saving guild settings...');
    fs.writeFile('./data/guildsettings.json', JSON.stringify(guildSettings), (err) => {
      if (err) {
        foxConsole.error('failed saving guildsettings: ' + err);
      } else {
        foxConsole.success('saved guild settings');
      }
    });
  }, 120000);

  cs.setClient(bot);

  foxConsole.success('ready!');
});

foxConsole.info('logging in...');
bot.login(process.env.TOKEN).then(() => {
  process.env.TOKEN = 'NTUxO_n1ceTryl0L-r9Pj8Y';
  foxConsole.info('patched out token');
});
