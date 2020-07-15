import * as discordutil from '../lib/discord';
import * as CommandSystem from 'cumsystem';

export function addCommands(cs: CommandSystem.System) {
	cs.addCommand(new CommandSystem.SimpleCommand('fahrenheit', (message) => {
		const params = discordutil.getParams(message);
		return `${params[0]}°C is **${Math.round(((Number(params[0]) * 9 / 5) + 32) * 100) / 100}°F**`;
	})
		.setCategory('utilities')
		.addAliases(['farenheit', 'farenheight', 'fairenheight', 'fairenheit', 'fahrenheight', 'americancelcius', 'stupidunit', 'notcelsius', 'notcelcius', 'weirdformulaunit', 'multiplyby1.8andadd32', '華氏', 'farandheight', 'westcelcius', 'unitusedbyonecountry', 'multiplybythesquarerootof3.24andadd8multipliedby4', 'multiplyby16.8minus6dividedby6andaddthesquarerootof1089minus1', 'solveaina=x*1.8+32ifx=', 'train1ismovingat1.8xthespeedoftrain2,howfarawayfromthestartinmetersistrain1ifitstarted32metersfurtherawaythantrain2andtrain2sdistancefromthestartinmetersis'])
		.setUsage('(number)')
		.setDescription('convert celsius to fahrenheit')
		.addExample('15'));

	cs.addCommand(new CommandSystem.SimpleCommand('celsius', (message) => {
		const params = discordutil.getParams(message);
		return `${params[0]}°F is **${Math.round(((Number(params[0]) - 32) * 5 / 9) * 100) / 100}°C**`;
	})
		.setCategory('utilities')
		.setUsage('(number)')
		.addAlias('celcius')
		.setDescription('convert fahrenheit to celsius')
		.addExample('59'));

	cs.addCommand(new CommandSystem.SimpleCommand('kelvin', (message) => {
		const params = discordutil.getParams(message);
		return `${params[0]}°C is ${Number(params[0]) < -273.15 ? `**physically impossible** ~~(buut would be **${Math.round((Number(params[0]) + 273.15) * 100) / 100}K**)~~` : `**${Math.round((Number(params[0]) + 273.15) * 100) / 100}K**`}`;
	})
		.setCategory('utilities')
		.setUsage('(number)')
		.addAlias('kevin')
		.setDescription('convert celsius to kelvin')
		.addExample('15'));

	cs.addCommand(new CommandSystem.SimpleCommand('mbs', (message) => {
		const params = discordutil.getParams(message);
		return `${params[0]}Mbps is **${Math.round((Number(params[0])) / 8 * 100) / 100}MB/s**`;
	})
		.setCategory('utilities')
		.setUsage('(number)')
		.addAlias('mb/s')
		.setDescription('convert mbps to mb/s')
		.addExample('8'));

	cs.addCommand(new CommandSystem.SimpleCommand('mbps', (message) => {
		const params = discordutil.getParams(message);
		return `${params[0]}MB/s is **${Math.round((Number(params[0])) * 800) / 100}Mbps**`;
	})
		.setCategory('utilities')
		.setUsage('(number)')
		.setDescription('convert mb/s to mbps')
		.addExample('1'));
}