import * as Discord from 'discord.js';
import * as os from 'os';
import * as util from '../lib/util';
import * as format from '../lib/format';
import * as CommandSystem from 'cumsystem';

import * as si from 'systeminformation';
import * as osu from 'node-os-utils';

// statistics

let cpuUsageMin: number = 0;
let cpuUsage30sec: number = 0;
let cpuUsage1sec: number = 0;

let cpuUsageMinOld = process.cpuUsage();
let cpuUsage30secOld = process.cpuUsage();
let cpuUsage1secOld = process.cpuUsage();

let systemInfo;
let cpuUsage;

si.getAllData('_', '_', data => {
	systemInfo = data;
});

setInterval(() => {
	const usage = process.cpuUsage(cpuUsage1secOld);
	cpuUsage1sec = 100 * (usage.user + usage.system) / 1000000;
	cpuUsage1secOld = process.cpuUsage();

	osu.cpu.usage().then(data => {
		cpuUsage = data;
	});
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
	let brandColor = cs.get('brandColor');
	let packageJson = cs.get('packageJson');
	let packageLock = cs.get('packageJsonLock');
	let botName = cs.get('botName');

	cs.addCommand(new CommandSystem.Command('info', (msg) => {
		let commit = cs.get('commit');

		msg.channel.send(new Discord.MessageEmbed()
			.setFooter(`Made using Node.JS ${process.version}, TypeScript ${packageLock.dependencies['typescript'].version}, Discord.JS v${packageLock.dependencies['discord.js'].version}`, cs.client.user.displayAvatarURL({dynamic: true}))
			.setTitle(`${botName} v${packageJson.version} (commit ${(commit || 'unknown').slice(0, 7)}) stats`)
			.setURL(packageJson.repository)
			.setColor(brandColor)
			.setDescription(`Currently in ${cs.client.guilds.cache.size.toLocaleString()} servers, with ${cs.client.channels.cache.size.toLocaleString()} cached channels and ${cs.client.users.cache.size.toLocaleString()} cached users`)
			.addField('Memory Usage', format.formatFileSize(process.memoryUsage().rss), true)
			.addField('CPU Usage', `Last second: **${util.roundNumber(cpuUsage1sec, 2)}%**
Last 30 seconds: **${util.roundNumber(cpuUsage30sec, 2)}%**
Last minute: **${util.roundNumber(cpuUsageMin, 2)}%**
Runtime: **${util.roundNumber(process.cpuUsage().user / (process.uptime() * 1000), 2)}%**`, true)
			.addField('Uptime', format.formatMiliseconds(process.uptime()), true));
	})
		.setCategory('core')
		.addAlias('stats')
		.setDescription('get some info and stats about the bot'));

	cs.addCommand(new CommandSystem.Command('hoststats', (msg) => {
		let memtotal = format.formatFileSize(os.totalmem());
		let memused = format.formatFileSize(os.totalmem() - os.freemem());
		let swaptotal = format.formatFileSize(systemInfo.mem.swaptotal);
		let swapused = format.formatFileSize(systemInfo.mem.swapused);

		let embed = new Discord.MessageEmbed()
			.setFooter(`Running on ${systemInfo.os.platform} - ${systemInfo.os.distro} (kernel version ${systemInfo.os.kernel}) (${systemInfo.os.arch}) ${systemInfo.os.release}`)
			.setTitle(`Host's stats - ${systemInfo.os.hostname}`)
			.setDescription('Stats for the bot\'s host')
			.setColor(brandColor)
			.addField('Uptime', format.formatMiliseconds(os.uptime()), true)
			.addField('BIOS', `${systemInfo.bios.vendor} ${systemInfo.bios.version}`, true)
			.addField('Baseboard', `${systemInfo.baseboard.manufacturer} ${systemInfo.baseboard.model} v${systemInfo.baseboard.version}`, true)
			.addField('Memory', `${memused}/${memtotal} used \`${util.progress(os.totalmem() - os.freemem(), os.totalmem())}\``)
			.addField('CPU', `${systemInfo.cpu.manufacturer} ${systemInfo.cpu.brand} model ${systemInfo.cpu.model} @${systemInfo.cpu.speedmax}GHz (${systemInfo.cpu.cores} cores) \nUsage: ${cpuUsage}% \`${util.progress(cpuUsage, 100)}\``)
			.addField(`Disk(s) (${systemInfo.fsSize.length} mounted)`, systemInfo.diskLayout.filter(d => !(d.name === '' || d.device.startsWith('/dev/ram'))).map(d => `${d.vendor} ${d.type} - ${d.device || d.name}, ${format.formatFileSize(d.size)}`));

		if (systemInfo.mem.swaptotal > 0)
			embed.addField('Swap', `${swapused}/${swaptotal} used \`${util.progress(systemInfo.mem.swapused, systemInfo.mem.swaptotal)}\``);

		if (systemInfo.graphics.controllers[0])
			embed.addField('GPU', `${systemInfo.graphics.controllers[0].vendor} ${systemInfo.graphics.controllers[0].model} w/ ${systemInfo.graphics.controllers[0].vram}MB VRAM`);

		msg.channel.send(embed);
	})
		.setCategory('core')
		.addAliases(['matstatsoatedition', 'oatstats', 'host', 'neofetch'])
		.setDescription('get some info and stats about the bot'));

	cs.addCommand(new CommandSystem.Command('listdependencies', (msg) => {
		let dependencyEmbed = new Discord.MessageEmbed()
			.setTitle(`${botName} Dependencies`)
			.setColor(brandColor)
			.setDescription('Dependencies taken from package.json, dependency versions taken from package-lock.json');

		Object.keys(packageJson.dependencies).forEach((dependency: string) => {
			if (!dependency.startsWith('@') && packageLock.dependencies[dependency] !== undefined) dependencyEmbed.addField(dependency, packageLock.dependencies[dependency].version, true);
		});

		msg.channel.send('', { embed: dependencyEmbed });
	})
		.setCategory('core')
		.addAlias('dependencies')
		.addAlias('depends')
		.addClientPermission('EMBED_LINKS')
		.setDescription('list the dependencies the bot uses, and their versions'));
}