import * as Discord from 'discord.js';
import * as os from 'os';
import * as fs from 'fs';
import * as util from './util';

const packageJson = JSON.parse(fs.readFileSync('./package.json', { encoding: 'utf8' }));
const packageLock = JSON.parse(fs.readFileSync('./package-lock.json', { encoding: 'utf8' }));

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

export function addCommands(cs, bot : Discord.Client) {

	cs.addCommand('core', new cs.Command('info', (msg) => {
		msg.channel.send(new Discord.RichEmbed()
			.setFooter(`Made using Node.JS ${process.version}, TypeScript ${packageLock.dependencies['typescript'].version}, Discord.JS v${packageLock.dependencies['discord.js'].version}`, bot.user.displayAvatarURL)
			.setTitle(`${bot.user.username} stats`)
			.setURL(packageJson.repository)
			.setDescription(`Currently in ${bot.guilds.size} servers, with ${bot.channels.size} channels and ${bot.users.size} users`)
			.addField('Memory Usage', util.formatFileSize(process.memoryUsage().rss), true)
			.addField('CPU Usage', `Last second: **${util.roundNumber(cpuUsage1sec, 3)}%**
Last 30 seconds: **${util.roundNumber(cpuUsage30sec, 3)}%**
Last minute: **${util.roundNumber(cpuUsageMin, 3)}%**
Runtime: **${util.roundNumber(process.cpuUsage().user / (process.uptime() * 1000), 3)}%**`, true)
			.addField('Uptime', util.formatMiliseconds(process.uptime()), true));
	})
		.addAlias('stats')
		.setDescription('get some info and stats about the bot'));

	cs.addCommand('core', new cs.Command('hoststats', (msg) => {
		let memtotal = util.formatFileSize(os.totalmem());
		let memused = util.formatFileSize(os.totalmem() - os.freemem());

		msg.channel.send(new Discord.RichEmbed()
			.setFooter(`Running on ${os.platform}/${os.type()} (${os.arch()}) version ${os.release()}`)
			.setTitle(`Host's stats - ${os.hostname()}`)
			.setDescription('Stats for the bot\'s host')
			.addField('Uptime', util.formatMiliseconds(os.uptime()), true)
			.addField('Memory', `${memused}/${memtotal} used`, true)
			.addField('CPU', `${os.cpus()[0].model}`, true));
	})
		.addAliases(['matstatsoatedition', 'oatstats', 'host', 'neofetch'])
		.setDescription('get some info and stats about the bot'));


	cs.addCommand('core', new cs.Command('listdependencies', (msg) => {
		let dependencyEmbed = new Discord.RichEmbed()
			.setTitle('Boteline Dependencies')
			.setColor('#FFFF00')
			.setDescription('Dependencies taken from package.json, dependency versions taken from package-lock.json');

		Object.keys(packageJson.dependencies).forEach((dependency: string) => {
			if (!dependency.startsWith('@') && packageLock.dependencies[dependency] !== undefined) dependencyEmbed.addField(dependency, packageLock.dependencies[dependency].version, true);
		});

		msg.channel.send('', { embed: dependencyEmbed });
	})
		.addAlias('dependencies')
		.addAlias('depends')
		.addClientPermission('EMBED_LINKS')
		.setDescription('list the dependencies boteline uses, and their versions'));
}