import * as CommandSystem from 'cumsystem';
import * as Discord from 'discord.js';
import * as util from '../lib/util';

import { NovelCovid } from 'novelcovid';
const track = new NovelCovid();

export function addCommands(cs: CommandSystem.System) {

	cs.addCommand('corona', new CommandSystem.SimpleCommand('corona', async (msg, content) => {
		let stats;
		if (content) {
			stats = await track.countries(content);
			// if (stats.message) stats = await track.states(content);
			// doesnt work, just errors
			if (stats.message) {
				let jhucsse = await track.jhucsse();
		
				let jhucsseStats = jhucsse.find((v) => 
					(
						(v.province !== null && v.province.toLowerCase().includes(content.toLowerCase())) ||
					v.country.toLowerCase().includes(content.toLowerCase())
					) && v.province !== 'Recovered' && v.province !== 'Deaths' && v.province !== 'Cases'
				);

				if (jhucsseStats) {
					stats = {
						cases: jhucsseStats.stats.confirmed,
						deaths: jhucsseStats.stats.deaths,
						recovered: jhucsseStats.stats.recovered,
						country: `${jhucsseStats.country}, ${jhucsseStats.province}`,
						// @ts-ignore the types are fucked for some reason and its a date
						updated: Number(Date.parse(jhucsseStats.updatedAt).toPrecision())
					};
				} else {
					stats = await track.all();
				}
			}
		} else {
			stats = await track.all();
		}

		let embed = new Discord.MessageEmbed()
			.setFooter(`Updated at ${util.formatDate(new Date(stats.updated))}`)
			.setTitle(stats.country || 'Worldwide')
			.addField('Cases', `${util.formatNum(stats.cases)} ${stats.todayCases ? `*+${util.formatNum(stats.todayCases)} today*` : ''} ${stats.deathsPerOneMillion ? `\n${util.formatNum(stats.casesPerOneMillion)} cases per 1mil` : ''}`, true)
			.addField('Deaths', `${util.formatNum(stats.deaths)} ${stats.todayDeaths ? `*+${util.formatNum(stats.todayDeaths)} today*` : ''} ${stats.deathsPerOneMillion ? `\n${util.formatNum(stats.deathsPerOneMillion)} deaths per 1mil` : ''}`, true)
			.addField('Recovered', `${util.formatNum(stats.recovered)} ${stats.todayRecovered ? `*+${util.formatNum(stats.todayRecovered)} today*` : ''}`, true)
			.addField('R/D ratio', `${util.roundNumber(stats.recovered / stats.deaths, 3)}`, true)
			.setDescription(`Mortality rate: ${util.roundNumber(stats.deaths / stats.cases * 100, 2)}%\nRecovery rate: ${util.roundNumber(stats.recovered / stats.cases * 100, 2)}%`);

		if (stats.active) embed.addField('Active', `${util.formatNum(stats.active)}${stats.critical ? `, ${util.formatNum(stats.critical)} (${util.roundNumber(stats.critical / stats.active, 2)}%) critical` : ''}`);
		if (stats.countryInfo) embed.setThumbnail(stats.countryInfo.flag);
		if (stats.affectedCountries) embed.addField('Affected countries', stats.affectedCountries, true);

		return embed;
	})
		.setDescription('corona')
		.addExample('Russia')
		.setUsage('[stirng]')
		.setDisplayUsage('[country/state]')
		.setUserCooldown(1000)
		.setGlobalCooldown(700));
}