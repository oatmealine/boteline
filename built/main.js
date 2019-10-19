"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-case-declarations */
// libraries & modules
var Discord = require('discord.js');
var bot = new Discord.Client();
var cs = require('./commandsystem.js');
require('colors');
var foxconsole = require('./foxconsole.js');
var exec = require('child_process').exec;
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');
// files
var packagejson = require('./package.json');
var packagelock = require('./package-lock.json');
if (!fs.existsSync('./foxquotes.json')) {
    fs.writeFileSync('./foxquotes.json', '[]');
}
var foxquotes = require('./foxquotes.json');
if (!fs.existsSync('./userdata.json')) {
    fs.writeFileSync('./userdata.json', '{}');
}
var userdata = require('./userdata.json');
if (!fs.existsSync('./guildsettings.json')) {
    fs.writeFileSync('./guildsettings.json', '{}');
}
var guildsettings = require('./guildsettings.json');
var foxquotessaveneeded = false;
// .env stuff
require('dotenv').config();
foxconsole.showDebug(process.env.DEBUG);
// constants & variables
var prefix = process.env.PREFIX;
var version = packagejson.version + ' alpha';
var valhalladrinks = require('./valhalla.json');
var application;
// statistics
var cpuusagemin = 'not enough data';
var cpuusage30sec = 'not enough data';
var cpuusage1sec = 'not enough data';
var cpuusageminold = process.cpuUsage();
var cpuusage30secold = process.cpuUsage();
var cpuusage1secold = process.cpuUsage();
setInterval(function () {
    var usage = process.cpuUsage(cpuusage1secold);
    cpuusage1sec = 100 * (usage.user + usage.system) / 1000000;
    cpuusage1secold = process.cpuUsage();
}, 1000);
setInterval(function () {
    var usage = process.cpuUsage(cpuusage30secold);
    cpuusage30sec = 100 * (usage.user + usage.system) / 30000000;
    cpuusage30secold = process.cpuUsage();
}, 30000);
setInterval(function () {
    var usage = process.cpuUsage(cpuusageminold);
    cpuusagemin = 100 * (usage.user + usage.system) / 60000000;
    cpuusageminold = process.cpuUsage();
}, 60000);
// functions
function makeDrinkEmbed(drink) {
    var embed = new Discord.RichEmbed({
        title: drink.name,
        fields: [
            {
                name: 'Description',
                value: '"' + drink.blurb + '"'
            },
            {
                name: 'Flavor',
                value: drink.flavour,
                inline: true
            },
            {
                name: 'Type',
                value: drink.type.join(', '),
                inline: true
            },
            {
                name: 'Price',
                value: '$' + drink.price,
                inline: true
            },
            {
                name: 'Preparation',
                value: "A **" + drink.name + "** is **" + drink.ingredients.adelhyde + "** Adelhyde, **" + drink.ingredients.bronson_extract + "** Bronson Extract, **" + drink.ingredients.powdered_delta + "** Powdered Delta, **" + drink.ingredients.flangerine + "** Flangerine " + (drink.ingredients.karmotrine === 'optional' ? 'with *(optional)*' : "and **" + drink.ingredients.karmotrine + "**") + " Karmotrine. All " + (drink.aged ? "aged" + (drink.iced ? ', ' : ' and ') : '') + (drink.iced ? 'on the rocks and ' : '') + (drink.blended ? 'blended' : 'mixed') + "."
            }
        ],
        footer: { text: 'CALICOMP 1.1' },
        color: [255, 0, 255]
    });
    embed.setColor([255, 0, 255]);
    return embed;
}
function hashCode(str) {
    var hash = 0, i, chr;
    if (str.length === 0)
        return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}
;
function getParams(message) {
    return message.content.split(' ').slice(1, message.content.length);
}
function normalDistribution(x) {
    return Math.pow(Math.E, (-Math.PI * x * x));
}
function seedAndRate(str) {
    var exclusions = { 'boteline': 0, 'mankind': 0, 'fox': 10, 'thefox': 10 };
    if (Object.keys(str).includes('str')) {
        return exclusions[str];
    }
    else {
        var hashCode_1 = Math.abs(str.hashCode());
        return Math.round(normalDistribution(hashCode_1 % 0.85) * 10);
    }
}
var FFMpegCommand = /** @class */ (function (_super) {
    __extends(FFMpegCommand, _super);
    function FFMpegCommand(name, inputOptions, outputOptions) {
        var _this = _super.call(this, name, null) || this;
        _this.inputOptions = inputOptions;
        _this.outputOptions = outputOptions;
        _this.function = function (msg) { return __awaiter(_this, void 0, void 0, function () {
            var params, attachments, videoattach_1, progmessage_1, lastedit_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = getParams(msg);
                        attachments = [];
                        if (!(msg.attachments.size === 0)) return [3 /*break*/, 2];
                        return [4 /*yield*/, msg.channel.fetchMessages({ limit: 20 }).then(function (msges) {
                                msges.array().forEach(function (m) {
                                    if (m.attachments.size > 0) {
                                        m.attachments.array().forEach(function (att) {
                                            attachments.push(att);
                                        });
                                    }
                                });
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        attachments.push(msg.attachments.first());
                        _a.label = 3;
                    case 3:
                        if (attachments.length > 0) {
                            attachments.forEach(function (attachment) {
                                if (videoattach_1 || !attachment)
                                    return;
                                var filetype = attachment.filename.split('.').pop();
                                var acceptedFiletypes = ['apng', 'webm', 'swf', 'wmv', 'mp4', 'flv', 'm4a'];
                                if (acceptedFiletypes.includes(filetype.toLowerCase())) {
                                    videoattach_1 = attachment;
                                }
                            });
                            if (videoattach_1) {
                                lastedit_1 = 0;
                                msg.channel.send('ok, downloading...').then(function (m) {
                                    progmessage_1 = m;
                                });
                                msg.channel.startTyping();
                                if (params[0]) {
                                    if (params[0].startsWith('.') || params[0].startsWith('/') || params[0].startsWith('~')) {
                                        if (progmessage_1) {
                                            progmessage_1.edit('i know exactly what you\'re doing there bud');
                                        }
                                        else {
                                            msg.channel.send('i know exactly what you\'re doing there bud');
                                        }
                                    }
                                }
                                ffmpeg(videoattach_1.url)
                                    .inputOptions(this.inputOptions(msg))
                                    .outputOptions(this.outputOptions(msg))
                                    .on('start', function (commandLine) {
                                    foxconsole.info('started ffmpeg with command: ' + commandLine);
                                    if (progmessage_1) {
                                        progmessage_1.edit('processing: 0% (0s) done');
                                    }
                                })
                                    .on('stderr', function (stderrLine) {
                                    foxconsole.debug('ffmpeg: ' + stderrLine);
                                })
                                    .on('progress', function (progress) {
                                    if (lastedit_1 + 2000 < Date.now() && progmessage_1) {
                                        lastedit_1 = Date.now();
                                        progmessage_1.edit("processing: **" + (progress.percent !== undefined ? Math.floor(progress.percent * 100) / 100 : '0.00') + "%** `(" + progress.timemark + ")`");
                                    }
                                })
                                    .on('error', function (err) {
                                    msg.channel.stopTyping();
                                    foxconsole.warning('ffmpeg failed!');
                                    foxconsole.warning(err);
                                    if (progmessage_1) {
                                        progmessage_1.edit("processing: error! `" + err + "`");
                                    }
                                    else {
                                        msg.channel.send("An error has occured!: `" + err + "`");
                                    }
                                })
                                    .on('end', function () {
                                    msg.channel.stopTyping();
                                    if (progmessage_1) {
                                        progmessage_1.edit('processing: done! uploading');
                                    }
                                    msg.channel.send('ok, done', { files: ['./temp.mp4'] }).then(function () {
                                        if (progmessage_1) {
                                            progmessage_1.delete();
                                        }
                                    });
                                })
                                    //.pipe(stream);
                                    .save('./temp.mp4');
                            }
                            else {
                                msg.channel.send('No video attachments found');
                            }
                        }
                        else {
                            msg.channel.send('No attachments found');
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        return _this;
    }
    return FFMpegCommand;
}(cs.Command));
console.log(("boteline v" + version).red.bold);
if (process.env.DEBUG)
    console.debug('debug printing on'.grey);
// i KNOW this is messy but like ,,, how else would you do this
console.log(("\n\n  " + '              '.bgRed + "\n" + '                  '.bgRed + "\n" + '        '.bgRed + '        '.bgYellow + '  '.bgRed + "\n" + '      '.bgRed + '  ██    ██'.white.bgYellow + '  '.bgRed + "\n  " + '    '.bgRed + '          '.bgYellow + "\n    " + '  '.bgRed + '        '.bgGreen + "\n      " + '  '.bgWhite + "    " + '  '.bgWhite + "\n\n").bold);
foxconsole.info('adding commands...');
cs.addCommand('core', new cs.SimpleCommand('invite', function () {
    return "Invite me here: <https://discordapp.com/oauth2/authorize?client_id=" + application.id + "&scope=bot&permissions=314432>";
})
    .setDescription('get the bot\'s invite')
    .addAlias('invitelink')
    .setUsage('invite'));
cs.addCommand('moderating', new cs.SimpleCommand('ban', function (message) {
    var params = message.content.split(' ').slice(1, message.content.length);
    if (message.guild.members.get(params[0]) !== undefined) {
        var banmember = message.guild.members.get(params[0]);
        if (banmember.id === message.member.id) {
            return 'hedgeberg#7337 is now b&. :thumbsup:'; // https://hedgeproofing.tech
        }
        if (banmember.bannable) {
            banmember.ban();
            return '✓ Banned ' + banmember.username;
        }
        else
            return 'member ' + banmember.username + ' isn\'t bannable';
    }
    else
        return 'i don\'t know that person!';
})
    .setUsage('ban (id)')
    .setDescription('ban a user')
    .addAlias('banuser')
    .addAlias('banmember')
    .addExample('ban 360111651602825216')
    .addClientPermission('BAN_MEMBERS')
    .addUserPermission('BAN_MEMBERS')
    .setGuildOnly());
cs.addCommand('moderating', new cs.SimpleCommand('kick', function (message) {
    var params = message.content.split(' ').slice(1, message.content.length);
    if (message.guild.members.get(params[0]) !== undefined) {
        var banmember = message.guild.members.get(params[0]);
        if (banmember.id === message.member.id) {
            return 'hedgeberg#7337 is now b&. :thumbsup:'; // https://hedgeproofing.tech
        }
        if (banmember.kickable) {
            banmember.ban();
            return '✓ Kicked ' + banmember.username;
        }
        else
            return 'member ' + banmember.username + ' isn\'t kickable';
    }
    else
        return 'i don\'t know that person!';
})
    .setUsage('kick (id)')
    .addAlias('kickuser')
    .addAlias('kickmember')
    .setDescription('kick a user')
    .addExample('kick 360111651602825216')
    .addClientPermission('KICK_MEMBERS')
    .addUserPermission('KICK_MEMBERS')
    .setGuildOnly());
cs.addCommand('utilities', new cs.SimpleCommand('fahrenheit', function (message) {
    var params = getParams(message);
    return params[0] + "\u00B0C is **" + Math.round(((Number(params[0]) * 9 / 5) + 32) * 100) / 100 + "\u00B0F**";
})
    .addAliases(['farenheit', 'farenheight', 'fairenheight', 'fairenheit', 'fahrenheight', 'americancelcius', 'stupidunit', 'notcelsius', 'notcelcius', 'weirdformulaunit', 'multiplyby1.8andadd32'])
    .setUsage('fahrenheit (number)')
    .setDescription('convert celsius to fahrenheit')
    .addExample('fahrenheit 15'));
cs.addCommand('utilities', new cs.SimpleCommand('celsius', function (message) {
    var params = getParams(message);
    return params[0] + "\u00B0F is **" + Math.round(((Number(params[0]) - 32) * 5 / 9) * 100) / 100 + "\u00B0C**";
})
    .setUsage('celsius (number)')
    .addAlias('celcius')
    .setDescription('convert fahrenheit to celsius')
    .addExample('celsius 59'));
cs.addCommand('utilities', new cs.SimpleCommand('kelvin', function (message) {
    var params = getParams(message);
    return params[0] + "\u00B0C is " + (params[0] < -273.15 ? "**physically impossible** ~~(buut would be **" + Math.round((Number(params[0]) + 273.15) * 100) / 100 + "K**)~~" : "**" + Math.round((Number(params[0]) + 273.15) * 100) / 100 + "K**");
})
    .setUsage('kelvin (number)')
    .setDescription('convert celsius to kelvin')
    .addExample('kelvin 15'));
cs.addCommand('utilities', new cs.SimpleCommand('mbs', function (message) {
    var params = getParams(message);
    return params[0] + "Mbps is **" + Math.round((Number(params[0])) / 8 * 100) / 100 + "MB/s**";
})
    .setUsage('mbs (number)')
    .addAlias('mb/s')
    .setDescription('convert mbps to mb/s')
    .addExample('mbs 8'));
cs.addCommand('utilities', new cs.SimpleCommand('mbps', function (message) {
    var params = getParams(message);
    return params[0] + "MB/s is **" + Math.round((Number(params[0])) * 800) / 100 + "Mbps**";
})
    .setUsage('mbps (number)')
    .setDescription('convert mb/s to mbps')
    .addExample('mbps 1'));
cs.addCommand('utilities', new cs.Command('icon', function (message) {
    message.channel.send('', { files: [{ attachment: message.guild.iconURL, name: 'icon.png' }] });
})
    .setUsage('icon')
    .addAlias('servericon')
    .addAlias('serverpic')
    .setDescription('get the server\'s icon')
    .addClientPermission('ATTACH_FILES')
    .setGuildOnly());
cs.addCommand('utilities', new cs.Command('pfp', function (msg) {
    var params = getParams(msg);
    var user;
    if (params[0] !== undefined) {
        user = bot.users.get(params[0]);
    }
    else {
        user = msg.author;
    }
    msg.channel.send('', { files: [{ attachment: user.avatarURL, name: 'avatar.png' }] });
})
    .setUsage('pfp [id]')
    .addAlias('avatar')
    .setDescription('get a user\'s pfp')
    .addClientPermission('ATTACH_FILES'));
cs.addCommand('fun', new cs.SimpleCommand('kva', function () {
    return 'ква ква ква  гав гав гав    мяяяяяу   беееее  муууу  ку ку';
})
    .setHidden()
    .addAlias('ква')
    .setDescription('ква'));
cs.addCommand('fun', new FFMpegCommand('compress', function () { return []; }, function (msg) {
    var params = getParams(msg);
    if (!params[0])
        params[0] = '20';
    return ["-b:v " + Math.abs(Number(params[0])) + "k", "-b:a " + Math.abs(params[0] - 3) + "k", '-c:a aac'];
})
    .setDescription('compresses a video')
    .addAlias('compression')
    .setUsage('compress [number]')
    .addClientPermission('ATTACH_FILES'));
cs.addCommand('fun', new cs.Command('eat', function (msg) {
    var params = getParams(msg);
    var eat = bot.emojis.get('612360473928663040').toString();
    var hamger1 = bot.emojis.get('612360474293567500').toString();
    var hamger2 = bot.emojis.get('612360473987252278').toString();
    var hamger3 = bot.emojis.get('612360473974931458').toString();
    var insidehamger = params[0] ? params.join(' ') : hamger2;
    msg.channel.send(eat + hamger1 + insidehamger + hamger3).then(function (m) {
        setTimeout(function () {
            m.edit(eat + insidehamger + hamger3).then(function (m) {
                setTimeout(function () {
                    m.edit(eat + hamger3).then(function (m) {
                        setTimeout(function () {
                            m.edit(eat).then(function (m) {
                                setTimeout(function () {
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
    .setUsage('eat [any]')
    .addAlias('burger')
    .addClientPermission('USE_EXTERNAL_EMOJIS'));
cs.addCommand('fun', new cs.Command('valhalla', function (msg) {
    var params = getParams(msg);
    if (params[0] === 'search') {
        var founddrinks_1 = [];
        var search_1 = params.slice(1, params.length).join(' ');
        valhalladrinks.forEach(function (d) {
            if (d.name.toLowerCase().includes(search_1.toLowerCase()) || d.flavour.toLowerCase() === search_1.toLowerCase()) {
                founddrinks_1.push(d);
            }
            else {
                d.type.forEach(function (f) {
                    if (search_1.toLowerCase() === f.toLowerCase()) {
                        founddrinks_1.push(d);
                    }
                });
            }
        });
        if (founddrinks_1.length < 1) {
            msg.channel.send("Found no matches for `" + params[1] + "`");
        }
        else if (founddrinks_1.length === 1) {
            msg.channel.send('', makeDrinkEmbed(founddrinks_1[0]));
        }
        else {
            var founddrinksstr_1 = '\n';
            founddrinks_1.slice(0, 5).forEach(function (d) {
                founddrinksstr_1 = founddrinksstr_1 + '**' + d.name + '**\n';
            });
            if (founddrinks_1.length > 5) {
                founddrinksstr_1 = founddrinksstr_1 + ("..and " + (founddrinks_1.length - 5) + " more drinks");
            }
            msg.channel.send("Found " + founddrinks_1.length + " drinks:\n" + founddrinksstr_1);
        }
    }
    else if (params[0] === 'make') {
        var adelhyde_1 = 0;
        var bronson_extract_1 = 0;
        var powdered_delta_1 = 0;
        var flangerine_1 = 0;
        var karmotrine_1 = 0;
        var blended_1 = false;
        var aged_1 = false;
        var iced_1 = false;
        params[1].split('').forEach(function (i) {
            switch (i) {
                case 'a':
                    adelhyde_1 += 1;
                    break;
                case 'b':
                    bronson_extract_1 += 1;
                    break;
                case 'p':
                    powdered_delta_1 += 1;
                    break;
                case 'f':
                    flangerine_1 += 1;
                    break;
                case 'k':
                    karmotrine_1 += 1;
            }
        });
        blended_1 = params.includes('blended');
        iced_1 = params.includes('ice');
        aged_1 = params.includes('aged');
        foxconsole.debug(adelhyde_1 + ", " + bronson_extract_1 + ", " + powdered_delta_1 + ", " + flangerine_1 + ", " + karmotrine_1);
        foxconsole.debug(blended_1 + ", " + aged_1 + ", " + iced_1);
        var drink_1;
        var drinkbig_1;
        valhalladrinks.forEach(function (d) {
            if (adelhyde_1 + bronson_extract_1 + powdered_delta_1 + flangerine_1 + karmotrine_1 > 20)
                return;
            drinkbig_1 = adelhyde_1 / 2 === d.ingredients.adelhyde
                && bronson_extract_1 / 2 === d.ingredients.bronson_extract
                && powdered_delta_1 / 2 === d.ingredients.powdered_delta
                && flangerine_1 / 2 === d.ingredients.flangerine
                && (karmotrine_1 / 2 === d.ingredients.karmotrine || d.ingredients.karmotrine === 'optional');
            if (adelhyde_1 !== d.ingredients.adelhyde && (adelhyde_1 / 2 !== d.ingredients.adelhyde || !drinkbig_1))
                return;
            if (bronson_extract_1 !== d.ingredients.bronson_extract && (bronson_extract_1 / 2 !== d.ingredients.bronson_extract || !drinkbig_1))
                return;
            if (powdered_delta_1 !== d.ingredients.powdered_delta && (powdered_delta_1 / 2 !== d.ingredients.powdered_delta || !drinkbig_1))
                return;
            if (flangerine_1 !== d.ingredients.flangerine && (flangerine_1 / 2 !== d.ingredients.flangerine || !drinkbig_1))
                return;
            if ((karmotrine_1 !== d.ingredients.karmotrine && (karmotrine_1 / 2 !== d.ingredients.karmotrine || !drinkbig_1)) && d.ingredients.karmotrine !== 'optional')
                return;
            if (blended_1 !== d.blended)
                return;
            if (aged_1 !== d.aged)
                return;
            if (iced_1 !== d.iced)
                return;
            drink_1 = d;
        });
        msg.channel.send(':timer: **Making drink...**').then(function (editmsg) {
            setTimeout(function () {
                if (drink_1 === undefined) {
                    editmsg.edit('Failed to make drink!');
                }
                else {
                    editmsg.edit('Successfully made drink!' + (drinkbig_1 ? ' (its big too, woah)' : ''), makeDrinkEmbed(drink_1));
                }
            }, blended_1 ? 7000 : 3000);
        });
    }
})
    .addAlias('va11halla')
    .addAlias('vallhalla')
    .setUsage('valhalla ((search) (drink name) | (make) (ingredients marked by their first letter) [mixed?] [on the rocks?] [aged?])')
    .addExample('valhalla search Frothy Water')
    .addExample('valhalla make abpf aged')
    .addExample('valhalla aabbbbppffffkkkkkkkk')
    .setDescription('search up drinks, and make some drinks, va11halla style!\nbasically a text-based replica of the drink making part of va11halla'));
cs.addCommand('fun', new cs.SimpleCommand('nwordpass', function (msg) {
    var params = getParams(msg);
    if (params[0] === 'toggle') {
        userdata[msg.author.id].nworddisable = !userdata[msg.author.id].nworddisable;
        return "the system is now **" + (userdata[msg.author.id].nworddisable ? 'OFF' : 'ON') + "**";
    }
    else {
        return "You have:\n\t**" + userdata[msg.author.id].nwordpasses + "** N-Word passes [**" + (userdata[msg.author.id].nworddisable ? 'OFF' : 'ON') + "**] (Use m=nwordpass toggle to disable/enable)\n\tYou are: **`[" + '█'.repeat(Math.floor((userdata[msg.author.id].nwordpassxp / userdata[msg.author.id].nwordpassxpneeded) * 10)) + '_'.repeat(10 - (userdata[msg.author.id].nwordpassxp / userdata[msg.author.id].nwordpassxpneeded) * 10) + "]`** this close to getting another N-Word pass";
    }
})
    .addAlias('nword')
    .addAlias('nwordpasses')
    .setDescription('see your amount of nwordpasses, or toggle the system')
    .setUsage('nwordpass [toggle]')
    .addExample('nwordpass toggle')
    .addExample('nwordpass'));
cs.addCommand('fun', new cs.SimpleCommand('rate', function (msg) {
    var params = getParams(msg);
    var thingToRate = params.join(' ');
    if (thingToRate.toLowerCase().startsWith('me') || thingToRate.toLowerCase().startsWith('my')) {
        // rate the user, not the string
        thingToRate += msg.author.id.toString().hashCode();
    }
    else if (thingToRate.toLowerCase().startsWith('this server') || thingToRate.toLowerCase().startsWith('this discord')) {
        // rate the server, not the string
        thingToRate = thingToRate + msg.guild.id.toString().hashCode();
    }
    var rating = seedAndRate(thingToRate.toLowerCase().split(' ').join(''));
    return "I'd give " + params.join(' ') + " a **" + rating + "/10**";
})
    .setDescription('rates something')
    .setUsage('rate (string)')
    .addExample('rate me'));
cs.addCommand('fun', new cs.SimpleCommand('pick', function (msg) {
    var params = getParams(msg);
    var thingToRate1 = params[0];
    var thingToRate2 = params[1];
    if (thingToRate1.toLowerCase().startsWith('me') || thingToRate1.toLowerCase().startsWith('my')) {
        thingToRate1 = thingToRate1 + msg.author.id.toString().hashCode();
    }
    else if (thingToRate1.toLowerCase().startsWith('this server') || thingToRate1.toLowerCase().startsWith('this discord')) {
        thingToRate1 = thingToRate1 + msg.guild.id.toString().hashCode();
    }
    if (thingToRate2.toLowerCase().startsWith('me') || thingToRate2.toLowerCase().startsWith('my')) {
        thingToRate2 = thingToRate2 + msg.author.id.toString().hashCode();
    }
    else if (thingToRate2.toLowerCase().startsWith('this server') || thingToRate2.toLowerCase().startsWith('this discord')) {
        thingToRate2 = thingToRate2 + msg.guild.id.toString().hashCode();
    }
    var rating1 = seedAndRate(thingToRate1.toLowerCase().split(' ').join(''));
    var rating2 = seedAndRate(thingToRate2.toLowerCase().split(' ').join(''));
    return "Out of " + params[0] + " and " + params[1] + ", I'd pick **" + (rating1 === rating2 ? 'neither' : (rating1 > rating2 ? thingToRate1 : thingToRate2)) + "**";
})
    .addAlias('choose')
    .setDescription('rates 2 objects, and picks one of them')
    .setUsage('pick (string) (string)')
    .addExample('pick njs python'));
cs.addCommand('fun', new cs.SimpleCommand('ask', function (msg) {
    var thingToRate = getParams(msg).join(' ');
    return "> " + thingToRate + "\nI'd say, **" + ['yes', 'probably', 'maybe', 'no'][Math.abs(thingToRate.hashCode()) * 23 % 4] + "**";
})
    .setDescription('ask the bot a question')
    .setUsage('ask (string)')
    .addAlias('askquestion')
    .addAlias('question')
    .addExample('ask is this a good example'));
cs.addCommand('fun', new cs.Command('achievement', function (msg) {
    var params = getParams(msg);
    msg.channel.send('', { files: [{ attachment: 'https://minecraftskinstealer.com/achievement/1/Achievement+Get%21/' + params.join('+'), name: 'achievement.png' }] });
})
    .addAlias('advancement')
    .setDescription('make a minecraft achievement')
    .setUsage('achievement (string)')
    .addExample('achievement Made an example!')
    .addClientPermission('ATTACH_FILES'));
cs.addCommand('fun', new cs.Command('foxquote', function (msg) {
    var randommsg = Object.values(foxquotes)[Math.floor(Math.random() * foxquotes.length)];
    if (randommsg === undefined) {
        return;
    }
    msg.channel.send('', new Discord.RichEmbed({
        author: { name: randommsg.author.username, icon: randommsg.author.avatarURL },
        timestamp: randommsg.createdTimestamp,
        description: randommsg.content
    }));
})
    .setHidden()
    .setUsage('foxquote')
    .addAlias('quotefox')
    .setDescription('fetches a random quote said by fox')
    .addClientPermission('EMBED_LINKS'));
cs.addCommand('debug', new cs.SimpleCommand('permtest', function () {
    return 'yay, it worked!';
})
    .setHidden()
    .setGuildOnly()
    .addUserPermission('MANAGE_MESSAGES')
    .addClientPermissions(['MANAGE_MESSAGES', 'BAN_MEMBERS'])
    .addAlias('permtestingalias'));
cs.addCommand('core', new cs.Command('info', function (msg) {
    msg.channel.send(new Discord.RichEmbed()
        .setFooter("Made using Node.JS " + process.version + ", Discord.JS v" + packagelock.dependencies['discord.js'].version, bot.user.avatarURL)
        .setTitle(bot.user.username + " stats")
        .setURL(packagejson.repository)
        .setDescription("Currently in " + bot.guilds.size + " servers, with " + bot.channels.size + " channels and " + bot.users.size + " users")
        .addField('Memory Usage', Math.round(process.memoryUsage().rss / 10000) / 100 + 'MB', true)
        .addField('CPU Usage', "Last second: **" + cpuusage1sec + "%**\nLast 30 seconds: **" + cpuusage30sec + "%**\nLast minute: **" + cpuusagemin + "%**\nRuntime: **" + Math.round(process.cpuUsage().user / (process.uptime() * 1000) * 100) / 100 + "%**", true)
        .addField('Uptime', Math.round(process.uptime() / 76800) + "d " + Math.round(process.uptime() / 3200) + "h " + Math.round(process.uptime() / 60) + "m " + Math.round(process.uptime()) + "s", true));
})
    .addAlias('stats')
    .setDescription('get some info and stats about the bot'));
cs.addCommand('core', new cs.SimpleCommand('prefix', function (msg) {
    var params = getParams(msg);
    if (!params[0])
        params[0] = prefix;
    params[0] = params[0].toLowerCase();
    if (guildsettings[msg.guild.id]) {
        guildsettings[msg.guild.id] = params[0];
    }
    else {
        guildsettings[msg.guild.id] = {
            prefix: params[0]
        };
    }
    return "changed prefix to " + params[0];
})
    .addAlias('setprefix')
    .addAlias('customprefix')
    .setDescription('set a custom prefix for boteline')
    .setUsage('prefix [string]')
    .addUserPermission('MANAGE_GUILD'));
foxconsole.info('starting...');
bot.on('message', function (msg) {
    var content = msg.content;
    var author = msg.author;
    if (author.id === process.env.OWNER && !content.startsWith(prefix)) {
        foxquotes.push({ createdTimestamp: msg.createdTimestamp, content: msg.content, author: { username: author.username, avatarURL: author.avatarURL } });
        foxquotessaveneeded = true;
    }
    if (userdata[author.id] === undefined) {
        userdata[author.id] = {
            nwordpasses: 1,
            nwordpassxp: 0,
            nwordpassxpneeded: 100,
            nextpass: 0,
            nworddisable: true
        };
    }
    if (!userdata[author.id].nworddisable && !content.startsWith(prefix)) {
        // patch for old accounts
        if (!userdata[author.id].nwordpassxpneeded) {
            userdata[author.id].nwordpassxpneeded = 100 + userdata[author.id].nwordpasses * 50;
        }
        var count = (msg.content.toLowerCase().replace(' ', '').match(/nigg/g) || []).length;
        if (count === 0 && Date.now() > userdata[author.id].nextpass) {
            userdata[author.id].nwordpassxp += Math.floor(Math.random() * 10 + 5);
            userdata[author.id].nextpass = Date.now() + 120000;
            if (userdata[author.id].nwordpassxp > userdata[author.id].nwordpassxpneeded) {
                userdata[author.id].nwordpassxp -= 100;
                userdata[author.id].nwordpasses += 1;
                userdata[author.id].nwordpassxpneeded = 100 + userdata[author.id].nwordpasses * 50;
                msg.channel.send("**" + author.username + "#" + author.discriminator + "** recieved an N-Word pass!");
            }
        }
        else {
            if (count > userdata[author.id].nwordpasses) {
                if (msg.deletable) {
                    msg.delete();
                }
                msg.reply('you don\'t have enough N-Word passes!');
            }
            else if (count !== 0) {
                userdata[author.id].nwordpasses -= count;
                msg.channel.send(":bangbang: " + msg.author.toString() + " used " + count + " N-Word " + (count === 1 ? 'pass' : 'passes'));
                userdata[author.id].nwordpassxpneeded = 100 + userdata[author.id].nwordpasses * 50;
            }
        }
    }
    var thisprefix = prefix;
    if (msg.guild) {
        if (guildsettings[msg.guild.id]) {
            thisprefix = guildsettings[msg.guild.id].prefix;
        }
    }
    if (content.startsWith(thisprefix)) {
        content = content.slice(thisprefix.length, content.length);
        var cmd_1 = content.split(' ')[0];
        foxconsole.debug('got command ' + cmd_1);
        Object.values(cs.commands).forEach(function (c) {
            Object.values(c).forEach(function (command) {
                if (command.name === cmd_1 || command.aliases.includes(cmd_1)) {
                    command.runCommand(msg, bot);
                }
            });
        });
        // debug and owneronly commands
        // not put into commandsystem for debugging if the system dies or something like that
        if (author.id === process.env.OWNER) {
            switch (cmd_1) {
                case 'debug':
                    var clean = function (text) {
                        if (typeof (text) === 'string') {
                            text = text.replace(/`/g, '`' + String.fromCharCode(8203)).replace(/@/g, '@' + String.fromCharCode(8203));
                            return text;
                        }
                        else
                            return text;
                    };
                    try {
                        var code = content.replace(cmd_1 + ' ', '');
                        var evaled = eval(code);
                        if (typeof evaled !== 'string')
                            evaled = require('util').inspect(evaled);
                        var embed = {
                            title: 'Eval',
                            color: '990000',
                            fields: [{
                                    name: 'Input',
                                    value: '```xl\n' + code + '\n```',
                                    inline: true
                                },
                                {
                                    name: 'Output',
                                    value: '```xl\n' + clean(evaled) + '\n```',
                                    inline: true
                                }
                            ]
                        };
                        msg.channel.send('', { embed: embed });
                        msg.react('☑');
                    }
                    catch (err) {
                        msg.channel.send(":warning: `ERROR` ```xl\n" + clean(err) + "\n```");
                    }
                    break;
                case 'exec':
                    exec(content.replace(cmd_1 + ' ', ''), function (err, stdout) {
                        if (err) {
                            msg.channel.send('```' + err + '```');
                        }
                        else {
                            msg.channel.send('```' + stdout + '```');
                        }
                    });
            }
        }
    }
});
bot.on('ready', function () {
    foxconsole.info('fetching application...');
    bot.fetchApplication().then(function (app) {
        application = app;
    });
    foxconsole.info('doing post-login intervals...');
    var presences = [['Celeste', 'PLAYING'], ['Celeste OST', 'LISTENING'], ['you', 'WATCHING'], ['sleep', 'PLAYING'], ["try " + process.env.PREFIX + "help", 'PLAYING'], ["Boteline v" + version]];
    setInterval(function () {
        presences.push([bot.guilds.size + " servers", 'WATCHING']);
        presences.push(["with " + bot.users.size + " users", 'PLAYING']);
        var presence = presences[Math.floor(Math.random() * presences.length)];
        bot.user.setPresence({ status: 'dnd', game: { name: presence[0], type: presence[1] } });
        foxconsole.debug("changed presence to [" + presence + "]");
    }, 30000);
    setInterval(function () {
        foxconsole.debug('saving userdata...');
        fs.writeFile('./userdata.json', JSON.stringify(userdata), function (err) {
            if (err) {
                foxconsole.error('failed saving userdata: ' + err);
            }
            else {
                foxconsole.success('saved userdata');
            }
        });
        foxconsole.debug('saving guild settings...');
        fs.writeFile('./guildsettings.json', JSON.stringify(guildsettings), function (err) {
            if (err) {
                foxconsole.error('failed saving guildsettings: ' + err);
            }
            else {
                foxconsole.success('saved guild settings');
            }
        });
        if (!foxquotessaveneeded)
            return;
        foxconsole.debug('saving foxquotes...');
        fs.writeFile('./foxquotes.json', JSON.stringify(foxquotes), function (err) {
            if (err) {
                foxconsole.error('failed saving foxquotes: ' + err);
            }
            else {
                foxconsole.success('saved foxquotes');
                foxquotessaveneeded = false;
            }
        });
    }, 120000);
    cs.bot = bot;
    foxconsole.success('ready!');
});
foxconsole.info('logging in...');
bot.login(process.env.TOKEN).then(function () {
    process.env.TOKEN = 'NTUxO_n1ceTryl0L-r9Pj8Y';
    foxconsole.info('patched out token');
});
