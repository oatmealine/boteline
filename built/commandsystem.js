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
var Discord = require('discord.js');
var foxconsole = require('./foxconsole.js');
var client;
function grammar(string) {
    var newstring = string.slice(1, string.length);
    return string[0].toUpperCase() + newstring;
}
function getParams(message) {
    return message.content.split(' ').slice(1, message.content.length);
}
var Command = /** @class */ (function () {
    function Command(name, cfunction) {
        this.name = name;
        this.function = cfunction;
        this.usage = name;
        this.displayUsage = name;
        this.clientPermissions = [];
        this.userPermissions = [];
        this.needsDM = false;
        this.needsGuild = false;
        this.hidden = false;
        this.owneronly = false;
        this.description = 'No description provided';
        this.aliases = [];
        this.examples = [];
        return this;
    }
    Command.prototype.setName = function (name) {
        this.name = name;
        return this;
    };
    Command.prototype.setUsage = function (usgstring) {
        this.usage = usgstring;
        this.displayUsage = usgstring;
        return this;
    };
    Command.prototype.setDisplayUsage = function (usgstring) {
        this.displayUsage = usgstring;
        return this;
    };
    Command.prototype.addExample = function (examplestring) {
        this.examples.push(examplestring);
        return this;
    };
    Command.prototype.addAlias = function (aliasstring) {
        this.aliases.push(aliasstring);
        return this;
    };
    Command.prototype.addAliases = function (aliasarr) {
        var _this = this;
        aliasarr.forEach(function (alias) {
            _this.addAlias(alias);
        });
        return this;
    };
    Command.prototype.setDescription = function (desc) {
        this.description = desc === undefined ? 'No description provided' : desc;
        return this;
    };
    Command.prototype.setHidden = function (hide) {
        this.hidden = hide === undefined ? true : hide;
        return this;
    };
    Command.prototype.setOwnerOnly = function (owner) {
        this.owneronly = owner === undefined ? true : owner;
        return this;
    };
    Command.prototype.setDMOnly = function (needs) {
        this.needsDM = needs === undefined ? true : needs;
        return this;
    };
    Command.prototype.setGuildOnly = function (needs) {
        this.needsGuild = needs === undefined ? true : needs;
        return this;
    };
    Command.prototype.addClientPermission = function (string) {
        if (Object.keys(Discord.Permissions.FLAGS).includes(string)) {
            this.clientPermissions.push(string);
        }
        else {
            foxconsole.warning('unknown permission ' + string);
        }
        return this;
    };
    Command.prototype.addUserPermission = function (string) {
        if (Object.keys(Discord.Permissions.FLAGS).includes(string)) {
            this.userPermissions.push(string);
        }
        else {
            foxconsole.warning('unknown permission ' + string);
        }
        return this;
    };
    Command.prototype.addClientPermissions = function (stringarr) {
        var _this = this;
        stringarr.forEach(function (string) {
            _this.addClientPermission(string);
        });
        return this;
    };
    Command.prototype.addUserPermissions = function (stringarr) {
        var _this = this;
        stringarr.forEach(function (string) {
            _this.addUserPermission(string);
        });
        return this;
    };
    Command.prototype.runCommand = function (message, client) {
        var params = getParams(message);
        if (this.needsGuild && !message.guild) {
            return message.channel.send('This command needs to be ran in a server!');
        }
        if (this.needsDM && message.guild) {
            return message.channel.send('This command needs to be ran in a DM!');
        }
        var argumentsvalid = [];
        if (this.usage && !this.usageCheck) {
            var argument = this.usage.split(' ');
            argument.shift();
            argument.forEach(function (arg, i) {
                if (params[i] !== undefined) {
                    switch (arg.slice(1, arg.length - 1)) {
                        case 'any':
                        case 'string':
                            argumentsvalid[i] = true;
                            break;
                        case 'url':
                            argumentsvalid[i] = params[i].startsWith('http://') || params[i].startsWith('https://');
                            break;
                        case 'number':
                            argumentsvalid[i] = !isNaN(params[i]);
                            break;
                        case 'id':
                            argumentsvalid[i] = client ? (client.guilds.get(params[i]) || client.users.get(params[i]) || client.channels.get(params[i])) : true;
                    }
                }
                else {
                    argumentsvalid[i] = arg.startsWith('[') && arg.endsWith(']');
                }
            });
        }
        else {
            argumentsvalid = this.usageCheck ? this.usageCheck(message) : null;
        }
        if (argumentsvalid !== null) {
            if (argumentsvalid.includes(false))
                return message.channel.send("Invalid syntax! `" + this.displayUsage + "`");
        }
        if (this.userPermissions.length > 0 && message.guild) {
            var missingpermissions_1 = [];
            this.userPermissions.forEach(function (perm) {
                if (!message.member.hasPermission(perm)) {
                    missingpermissions_1.push(perm);
                }
            });
            if (missingpermissions_1.length > 0) {
                return message.channel.send("**You can't run this command!** You need these permissions to use this command: `" + missingpermissions_1.join(', ') + "`");
            }
        }
        if (this.clientPermissions.length > 0 && message.guild) {
            var missingpermissions_2 = [];
            this.clientPermissions.forEach(function (perm) {
                if (!message.guild.me.hasPermission(perm)) {
                    missingpermissions_2.push(perm);
                }
            });
            if (missingpermissions_2.length > 0) {
                return message.channel.send("**I can't run this command!** This bot need these permissions to run this command: `" + missingpermissions_2.join(', ') + "`");
            }
        }
        return this.function(message, client);
    };
    return Command;
}());
var SimpleCommand = /** @class */ (function (_super) {
    __extends(SimpleCommand, _super);
    function SimpleCommand(name, cfunction) {
        var _this = _super.call(this, name, cfunction) || this;
        _this.function = function (message, client) {
            var returned = cfunction(message, client);
            if (!returned) {
                foxconsole.warning('SimpleCommand returned nothing, please use Command class instead');
                return;
            }
            if (returned.then) { // check if its a promise or not
                returned.then(function (messageResult) {
                    return message.channel.send(messageResult);
                });
            }
            else {
                return message.channel.send(returned);
            }
        };
        return _this;
    }
    return SimpleCommand;
}(Command));
var commands = {
    core: {
        help: new SimpleCommand('help', function (message) {
            var params = message.content.split(' ');
            if (params[1]) {
                var command_1;
                var categoryname_1;
                Object.values(module.exports.commands).forEach(function (category, i) {
                    if (command_1)
                        return;
                    categoryname_1 = Object.keys(module.exports.commands)[i];
                    Object.values(category).forEach(function (cmd) {
                        if (cmd.name === params[1] || cmd.aliases.includes(params[1])) {
                            command_1 = cmd;
                        }
                    });
                });
                if (command_1) {
                    var embed = new Discord.RichEmbed()
                        .setTitle("**" + grammar(command_1.name) + "** (" + grammar(categoryname_1) + ")")
                        .addField('Usage', command_1.displayUsage)
                        .setDescription(command_1.description)
                        .setColor(Math.floor(Math.random() * 16777215));
                    if (command_1.examples.length !== 0)
                        embed = embed.addField('Examples', '`' + command_1.examples.join('`,\n`') + '`');
                    if (command_1.aliases.length !== 0)
                        embed = embed.addField('Aliases', command_1.aliases.join(', '));
                    return embed;
                }
                else {
                    var category_1;
                    var categoryname_2;
                    Object.values(module.exports.commands).forEach(function (cat, i) {
                        if (category_1)
                            return;
                        categoryname_2 = Object.keys(module.exports.commands)[i];
                        if (categoryname_2 === params[1].toLowerCase())
                            category_1 = cat;
                    });
                    if (category_1) {
                        var embed = new Discord.RichEmbed()
                            .setTitle("**" + grammar(categoryname_2) + "** [" + Object.keys(category_1).length + "]")
                            .setColor(Math.floor(Math.random() * 16777215));
                        var commands_1 = [];
                        Object.values(category_1).forEach(function (cmd) {
                            if (!cmd.hidden)
                                commands_1.push('`' + cmd.name + '` - ' + cmd.description);
                        });
                        if (commands_1.length !== 0)
                            embed.addField('Commands', commands_1.join('\n'));
                        return embed;
                    }
                    else
                        return "Command or category `" + params[1] + "` not found!";
                }
            }
            else {
                var embed_1 = new Discord.RichEmbed()
                    .setTitle('**All Boteline Commands**')
                    .setColor(Math.floor(Math.random() * 16777215))
                    .setFooter('Do help (category) to get all commands for a category!');
                Object.values(module.exports.commands).forEach(function (category, i) {
                    var categoryname = Object.keys(module.exports.commands)[i];
                    var commands = [];
                    Object.values(category).forEach(function (cmd) {
                        if (!cmd.hidden)
                            commands.push(cmd.name);
                    });
                    if (commands.length !== 0)
                        embed_1.addField(grammar(categoryname) + " [" + commands.length + "]", '`' + commands.join('`, `') + '`');
                });
                return embed_1;
            }
        })
            .setUsage('help [string]')
            .addAlias('cmds')
            .setDescription('see commands, or check out a comnmand in detail'),
        ping: new Command('ping', function (message, bot) {
            var datestart = Date.now();
            message.channel.send('hol up').then(function (m) {
                m.edit("Message latency: " + (Date.now() - datestart) + "ms\nWebsocket ping: " + bot.ping + "ms");
            });
        })
            .setUsage('ping')
            .setDescription('ping the bot')
    }
};
function addCommand(category, command) {
    if (!module.exports.commands[category]) {
        module.exports.commands[category] = [];
    }
    module.exports.commands[category][command.name] = command;
}
module.exports = {
    bot: client,
    SimpleCommand: SimpleCommand,
    Command: Command,
    commands: commands,
    addCommand: addCommand
};
