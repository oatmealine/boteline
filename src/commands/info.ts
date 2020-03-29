import * as Discord from 'discord.js';
import * as os from 'os';
import * as fs from 'fs';
import * as util from '../lib/util';
import * as CommandSystem from 'cumsystem';

import * as si from 'systeminformation';

const packageJson = JSON.parse(fs.readFileSync('./package.json', { encoding: 'utf8' }));
const packageLock = JSON.parse(fs.readFileSync('./package-lock.json', { encoding: 'utf8' }));

// statistics

let cpuUsageMin: number = 0;
let cpuUsage30sec: number = 0;
let cpuUsage1sec: number = 0;

let cpuUsageMinOld = process.cpuUsage();
let cpuUsage30secOld = process.cpuUsage();
let cpuUsage1secOld = process.cpuUsage();

let systemInfo;

si.getStaticData(data => {
	systemInfo = data;
});

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

export function addCommands(cs: CommandSystem.System) {

	cs.addCommand('core', new CommandSystem.Command('info', (msg) => {
		msg.channel.send(new Discord.MessageEmbed()
			.setFooter(`Made using Node.JS ${process.version}, TypeScript ${packageLock.dependencies['typescript'].version}, Discord.JS v${packageLock.dependencies['discord.js'].version}`, cs.client.user.displayAvatarURL({dynamic: true}))
			.setTitle(`${cs.client.user.username} v${packageJson.version} stats`)
			.setURL(packageJson.repository)
			.setDescription(`Currently in ${cs.client.guilds.cache.size} servers, with ${cs.client.channels.cache.size} cached channels and ${cs.client.users.cache.size} cached users`)
			.addField('Memory Usage', util.formatFileSize(process.memoryUsage().rss), true)
			.addField('CPU Usage', `Last second: **${util.roundNumber(cpuUsage1sec, 3)}%**
Last 30 seconds: **${util.roundNumber(cpuUsage30sec, 3)}%**
Last minute: **${util.roundNumber(cpuUsageMin, 3)}%**
Runtime: **${util.roundNumber(process.cpuUsage().user / (process.uptime() * 1000), 3)}%**`, true)
			.addField('Uptime', util.formatMiliseconds(process.uptime()), true));
	})
		.addAlias('stats')
		.setDescription('get some info and stats about the bot'));

	cs.addCommand('core', new CommandSystem.Command('hoststats', (msg) => {
		let memtotal = util.formatFileSize(os.totalmem());
		let memused = util.formatFileSize(os.totalmem() - os.freemem());

		msg.channel.send(new Discord.MessageEmbed()
			.setFooter(`Running on ${systemInfo.os.platform} - ${systemInfo.os.distro} (kernel version ${systemInfo.os.kernel}) (${systemInfo.os.arch}) ${systemInfo.os.release}`)
			.setTitle(`Host's stats - ${systemInfo.os.hostname}`)
			.setDescription('Stats for the bot\'s host')
			.addField('Uptime', util.formatMiliseconds(os.uptime()), true)
			.addField('Memory', `${memused}/${memtotal} used`, true)
			.addField('BIOS', `${systemInfo.bios.vendor} ${systemInfo.bios.version}`, true)
			.addField('Baseboard', `${systemInfo.baseboard.manufacturer} ${systemInfo.baseboard.model} v${systemInfo.baseboard.version}`, true)
			.addField('CPU', `${systemInfo.cpu.manufacturer} ${systemInfo.cpu.brand} model ${systemInfo.cpu.model} @${systemInfo.cpu.speedmax}GHz (${systemInfo.cpu.cores} cores)`, true));
	})
		.addAliases(['matstatsoatedition', 'oatstats', 'host', 'neofetch'])
		.setDescription('get some info and stats about the cs.client'));

	cs.addCommand('core', new CommandSystem.Command('listdependencies', (msg) => {
		let dependencyEmbed = new Discord.MessageEmbed()
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