import * as CommandSystem from 'cumsystem';
import * as Discord from 'discord.js';
import * as util from '../lib/util';

import { NovelCovid } from 'novelcovid';
const track = new NovelCovid();

async function getStats(content: string) {
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

	return stats;
}

export function addCommands(cs: CommandSystem.System) {

	cs.addCommand(new CommandSystem.SimpleCommand('corona', async (msg, content) => {
		let stats = await getStats(content);

		let embed = new Discord.MessageEmbed()
			.setURL('https://disease.sh/')
			.setFooter('Data from disease.sh')
			.setTimestamp(stats.updated)
			.setTitle(stats.country || stats.continent || 'Worldwide')
			.addField('Cases', `${stats.cases.toLocaleString()} ${stats.todayCases ? `*+${stats.todayCases.toLocaleString()} today*` : ''}`, true)
			.addField('Deaths', `${stats.deaths.toLocaleString()} ${stats.todayDeaths ? `*+${stats.todayDeaths.toLocaleString()} today*` : ''}`, true)
			.addField('Recovered', `${stats.recovered.toLocaleString()} ${stats.todayRecovered ? `*+${stats.todayRecovered.toLocaleString()} today*` : ''}`, true);

		if (stats.tests) embed.addField('Tests', `${stats.tests.toLocaleString()} (${util.roundNumber(stats.cases / stats.tests * 100, 1)}% of tests are infections) ${stats.testsPerOneMillion ? ` \n${stats.testsPerOneMillion.toLocaleString()} tests per 1mil` : ''}`, true);
		if (stats.active) embed.addField('Active', `${stats.active.toLocaleString()}${stats.critical ? `, ${stats.critical.toLocaleString()} (${util.roundNumber(stats.critical / stats.active, 1)}%) critical` : ''}`);
		if (stats.countryInfo) embed.setThumbnail(stats.countryInfo.flag);
		if (stats.affectedCountries) embed.addField('Affected countries', stats.affectedCountries, true);
		if (stats.countries && !stats.affectedCountries) embed.addField('Affected countries', stats.countries.length, true);

		return embed;
	})
		.setCategory('corona')
		.setDescription('corona')
		.addExample('Russia')
		.addExample('Michigan')
		.addAlias('covid')
		.setUsage('[string]')
		.setDisplayUsage('[country/state]')
		.setUserCooldown(1000)
		.setGlobalCooldown(700));

	cs.addCommand(new CommandSystem.SimpleCommand('relativecorona', async (msg, content) => {
		let stats = await getStats(content);

		if (stats.recovered && stats.deaths && stats.casesPerOneMillion && stats.testsPerOneMillion) {
			let caseRate = stats.casesPerOneMillion / 1000000;
			let testRate = stats.testsPerOneMillion / 1000000;

			// would rather not explain what this does but in short,
			// lets assume everyone took a test in the entire country
			// assuming that you can then trust the infection rate thats formed already, you can just apply that for the tests that dont exist to estimate the cases
			// its similar for deaths and recoveries
			// this probably makes no sense but i tried my best here
			let caseRateRealisticPerMil = ((1 - testRate) * 1000000) * (caseRate) + (caseRate * 1000000);
			let caseRateWorstCasePerMil = ((1 - testRate) * 1000000) * ((caseRate * 1000000) / (testRate * 1000000)) + (caseRate * 1000000);

			let embed = new Discord.MessageEmbed()
				.setURL('https://disease.sh/')
				.setFooter('Data from disease.sh')
				.setTimestamp(stats.updated)
				.setTitle((stats.country || stats.continent || 'Worldwide') + ' relative stats')
				.addField('Cases per mil., predicted (worst case)', util.roundNumber(caseRateWorstCasePerMil, 0).toLocaleString(), true)
				.addField('Cases per mil., predicted (realistic)', util.roundNumber(caseRateRealisticPerMil, 0).toLocaleString(), true)
				.addField('Cases per mil., actual', stats.casesPerOneMillion.toLocaleString(), true)
				.addField('R/D ratio', util.roundNumber(stats.recovered / stats.deaths, 3), false)
				.setDescription(`Mortality rate: ${util.roundNumber(stats.deaths / stats.cases * 100, 2)}%\nRecovery rate: ${util.roundNumber(stats.recovered / stats.cases * 100, 2)}%\nPredicted cases per million assumes everyone in the area takes a test, therefore accounting for people who have/had COVID but haven't done a test`);

			if (stats.countryInfo) embed.setThumbnail(stats.countryInfo.flag);

			return embed;
		} else {
			return 'There isn\'t enough data to do the measurements!';
		}
	})
		.setCategory('corona')
		.setDescription('corona with relative stats, so every country is rated fairly')
		.addAliases(['rcovid', 'rcorona', 'relcovid', 'relcorona'])
		.addExample('Russia')
		.addExample('Michigan')
		.setUsage('[string]')
		.setDisplayUsage('[country/state]')
		.setUserCooldown(1000)
		.setGlobalCooldown(700));
}