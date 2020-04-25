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
						(v.province !== null && (v.province instanceof Array ? v.province.join('') : v.province).toLowerCase().includes(content.toLowerCase())) ||
					v.country.toLowerCase().includes(content.toLowerCase())
					) && v.province !== 'Recovered' && v.province !== 'Deaths' && v.province !== 'Cases'
				);

				if (jhucsseStats) {
					stats = {
						cases: jhucsseStats.stats.confirmed,
						deaths: jhucsseStats.stats.deaths,
						recovered: jhucsseStats.stats.recovered,
						country: `${jhucsseStats.country}, ${jhucsseStats.province instanceof Array ? jhucsseStats.province.join(' ') : jhucsseStats.province}`,
						// @ts-ignore the types are fucked for some reason and its a date
						updated: Number(Date.parse(jhucsseStats.updatedAt).toPrecision())
					};
				} else {
					stats = await track.continents(content);
					
					if (!stats || !stats.cases || stats.message) stats = await track.all();
				}
			}
		} else {
			stats = await track.all();
		}

		let embed = new Discord.MessageEmbed()
			.setURL('https://disease.sh/')
			.setFooter('Data from disease.sh')
			.setTimestamp(stats.updated)
			.setTitle(stats.country || stats.continent || 'Worldwide')
			.addField('Cases', `${stats.cases.toLocaleString()} ${stats.todayCases ? `*+${stats.todayCases.toLocaleString()} today*` : ''} ${stats.testsPerOneMillion ? ` \n${stats.casesPerOneMillion.toLocaleString()} cases per 1mil` : ''}`, true)
			.addField('Deaths', `${stats.deaths.toLocaleString()} ${stats.todayDeaths ? `*+${stats.todayDeaths.toLocaleString()} today*` : ''} ${stats.deathsPerOneMillion ? ` \n${stats.deathsPerOneMillion.toLocaleString()} deaths per 1mil` : ''}`, true)
			.addField('Recovered', `${stats.recovered.toLocaleString()} ${stats.todayRecovered ? `*+${stats.todayRecovered.toLocaleString()} today*` : ''}`, true)
			.setDescription(`Mortality rate: ${util.roundNumber(stats.deaths / stats.cases * 100, 2)}%\nRecovery rate: ${util.roundNumber(stats.recovered / stats.cases * 100, 2)}%`);

		if (stats.tests) embed.addField('Tests', `${stats.tests.toLocaleString()} (${util.roundNumber(stats.cases / stats.tests * 100, 1)}% of tests are infections) ${stats.testsPerOneMillion ? ` \n${stats.testsPerOneMillion.toLocaleString()} tests per 1mil` : ''}`, true);
		if (stats.active) embed.addField('Active', `${stats.active.toLocaleString()}${stats.critical ? `, ${stats.critical.toLocaleString()} (${util.roundNumber(stats.critical / stats.active, 2)}%) critical` : ''}`);
		embed.addField('R/D ratio', `${util.roundNumber(stats.recovered / stats.deaths, 3)}`, true);
		if (stats.countryInfo) embed.setThumbnail(stats.countryInfo.flag);
		if (stats.affectedCountries) embed.addField('Affected countries', stats.affectedCountries, true);
		if (stats.countries && !stats.affectedCountries) embed.addField('Affected countries', stats.countries.length, true);

		return embed;
	})
		.setDescription('corona')
		.addExample('Russia')
		.addExample('Michigan')
		.addAlias('covid')
		.setUsage('[string]')
		.setDisplayUsage('[country/state]')
		.setUserCooldown(1000)
		.setGlobalCooldown(700));
}