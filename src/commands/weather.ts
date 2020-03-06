import * as weather from 'openweather-apis';
import * as util from '../lib/util';
import { MessageEmbed } from 'discord.js';
import * as CommandSystem from 'cumsystem';

weather.setLang('en');
weather.setAPPID(process.env.OPENWEATHERAPPID);
weather.setUnits('metric');

export function addCommands(cs: CommandSystem.System) {
	cs.addCommand('utilities', new CommandSystem.Command('weather', (msg) => {
		const params = util.getParams(msg);

		weather.setCity(params.join(' '));
    
		weather.getAllWeather((err, res) => {
			if (err) return msg.channel.send(err);
			if (!res.sys) return msg.channel.send(`City not found or response empty: \`${JSON.stringify(res)}\``);

			let embed = new MessageEmbed()
				.setTitle(`${res.name}, ${res.sys.country}`)
				.setThumbnail('http://openweathermap.org/img/w/' + res.weather[0].icon + '.png')
				.addField('Weather', res.weather[0].main, true)
				.addField('Temperature', `${res.main.temp}C`)
				.addField('Wind speed', `${res.wind.speed}m/s`, true)
				.setColor('11FF11');

			return msg.channel.send(embed);
		});
	})
		.setDescription('fetch the weather for a city, if it doesnt respond then it likely didnt find the city')
		.setUsage('(string)')
		.setDisplayUsage('(city)')
		.addClientPermission('EMBED_LINKS'));
}