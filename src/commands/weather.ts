import { MessageEmbed } from 'discord.js';
import * as CommandSystem from 'cumsystem';
const got = require('got');

export function addCommands(cs: CommandSystem.System) {
	cs.addCommand('utilities', new CommandSystem.Command('weather', (msg, content) => {
		got(`http://api.weatherstack.com/current?access_key=${process.env.WEATHERSTACKKEY}&query=${encodeURI(content)}`).then((res, err) => {
			if (err) return msg.channel.send(err);

			let weather = JSON.parse(res.body);

			if (weather.success === false) return msg.channel.send(`API returned error: \`${weather.error.info}\``);

			let utc = weather.location.utc_offset;

			if (!utc.startsWith('-')) utc = '+' + utc;

			let embed = new MessageEmbed()
				.setTitle(`${weather.request.query}`)
				.setDescription(`${weather.location.localtime} (UTC ${utc})`)
				.setThumbnail(weather.current.weather_icons[0])
				.addField('Weather description', weather.current.weather_descriptions.join('\n'), true)
				.addField('Temperature', `${weather.current.temperature}°C\n*Feels like ${weather.current.feelslike}°C*`)
				.addField('Wind speed', `${weather.current.wind_speed}km/h ${weather.current.wind_dir}`, true)
				.addField('Humidity', `${weather.current.humidity}%`)
				.setColor('11FF11');

			return msg.channel.send(embed);
		});
	})
		.setDescription('fetch the weather for a city, if it doesnt respond then it likely didnt find the city')
		.setUsage('(string)')
		.setDisplayUsage('(city)')
		.addClientPermission('EMBED_LINKS'));
}