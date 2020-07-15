import * as booru from 'booru';
import * as util from '../lib/util';
import * as discordutil from '../lib/discord';
import * as Discord from 'discord.js';
import * as CommandSystem from 'cumsystem';

function getSites() {
	let sites = booru.sites;
	let sitesObj = {};

	Object.keys(sites).filter(s => s !== 'lolibooru.moe' /* no pedophiles allowed */).forEach(s => {
		let site = sites[s];
		if (!site) return;
		
		sitesObj[s] = site;
	});
	
	return sitesObj;
}

export function addCommands(cs: CommandSystem.System) {
	cs.addCommand(new CommandSystem.Command('boorufetch', msg => {
		const params = discordutil.getParams(msg);

		let tags = params.slice(1);
		let sites = getSites();

		let site: any = Object.values(sites).find((v: any) => v.domain === params[0] || v.aliases.includes(params[0])); // booru has stupid classes

		if (site) {
			if (site.nsfw && !(msg.channel.type !== 'text' || msg.channel.nsfw)) return msg.channel.send('This site is NSFW, and you aren\'t in an NSFW channel!');

			return booru.search(params[0], tags, {limit: 1, random: true})
				.then(results => {
					let img = results[0];

					if (!img) return msg.channel.send('No images found (?? i think)');

					let embed = new Discord.MessageEmbed()
						.setTitle(img.id)
						.setURL(img.postView)
						.setImage(img.fileUrl)
						.setColor('#334433')
						.setDescription(`Score: ${img.score || '?'}\nTags: \`${util.shortenStr(img.tags.join(', '), 500)}\`${img.source ? `\n[Source](${img.source})` : ''}`);

					return msg.channel.send(embed);
				});
		} else {
			return msg.channel.send('That site isn\'t supported!');
		}
	})
		.setCategory('booru')
		.setDescription('searches a booru site for tags\nthe available sites can be checked w/ m.boorusites')
		.setUsage('(string) (string)')
		.addAlias('booru')
		.setDisplayUsage('(site) (tags..)'));

	cs.addCommand(new CommandSystem.SimpleCommand('boorusites', () => 
		Object.keys(getSites())
			.sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0))
			.map(s => `${s}${getSites()[s].nsfw ? ' (NSFW)' : ''}`).join(', ') // im sorry
	)
		.setCategory('booru')
		.setDescription('see what sites are available for m.boorusites'));
}