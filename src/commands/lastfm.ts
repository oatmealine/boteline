import * as CommandSystem from 'cumsystem';
import * as Discord from 'discord.js';
import * as util from '../lib/util';
import * as timeago from 'timeago.js';
const got = require('got');

let apikey = process.env.LASTFM_API_KEY;

export function addCommands(cs: CommandSystem.System) {
	cs.addCommand(new CommandSystem.SimpleCommand('nowplaying', async (msg, content) => {
		let res = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=1&extended=1&user=${encodeURI(content)}&api_key=${apikey}&format=json`);
		let data = JSON.parse(res.body);

		let playingTrack = data.recenttracks.track.find(t => t['@attr'] && t['@attr'].nowplaying === 'true');
		if (!playingTrack) return 'No track playing';

		// for pfp 
		let resUser = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${encodeURI(content)}&api_key=${apikey}&format=json`);
		let userData = JSON.parse(resUser.body);

		// top tracks provides play amount and rank
		let resTopTracks = await got(`http://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${encodeURI(content)}&limit=100&api_key=${apikey}&format=json`);
		let topTracksData = JSON.parse(resTopTracks.body);
		let playingTrackExtended = topTracksData.toptracks.track.find(t => t.url === playingTrack.url);

		let embed = new Discord.MessageEmbed()
			.setTitle(`${playingTrack.loved === '1' ? '\\❤️ ' : ''}${playingTrack.artist.name} - ${playingTrack.name}`)
			.setThumbnail(playingTrack.image.pop()['#text'])
			.setTimestamp()
			.setURL(playingTrack.url)
			.setColor('#63de54')
			.setAuthor(userData.user.name, userData.user.image.pop()['#text'], userData.user.url);

		let description = '';
		if (playingTrack.album['#text']) description += `from ${playingTrack.album['#text']}`;

		if (playingTrackExtended) {
			description += `\n${util.rankNum(Number(playingTrackExtended['@attr'].rank))} most played track of user`;
			embed.addField('Scrobble count', playingTrackExtended.playcount);
		}

		embed.setDescription(description);

		return embed;
	})
		.addAlias('np')
		.setDescription('check what a user is playing on last.fm')
		.setGlobalCooldown(1500)
		.setUsage('(string)')
		.setDisplayUsage('(username)')
		.setCategory('last.fm'));

	cs.addCommand(new CommandSystem.SimpleCommand('recent', async (msg, content) => {
		let res = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=11&extended=1&user=${encodeURI(content)}&api_key=${apikey}&format=json`);
		let data = JSON.parse(res.body);

		let playingTrack = data.recenttracks.track.find(t => t['@attr'] && t['@attr'].nowplaying === 'true');
		let tracks = data.recenttracks.track.filter(t => t !== playingTrack); // filter out current track

		// for pfp 
		let resUser = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${encodeURI(content)}&api_key=${apikey}&format=json`);
		let userData = JSON.parse(resUser.body);

		let embed = new Discord.MessageEmbed()
			.setTitle('Recent scrobbles')
			.setColor('#63de54')
			.setURL(userData.user.url)
			.setAuthor(userData.user.name, userData.user.image.pop()['#text'], userData.user.url)
			.setTimestamp()
			.addField('Total scrobbles', data.recenttracks['@attr'].total);

		let description = '';

		if (playingTrack) {
			embed.setThumbnail(playingTrack.image.pop()['#text']);
			description += `**Scrobbling now**: ${playingTrack.loved === '1' ? '❤️ ' : ''}${playingTrack.artist.name} - ${playingTrack.name}\n\n`;
		}

		description += tracks.slice(0, 10).map((t, i) => `${i + 1}. ${t.loved === '1' ? '❤️ ' : ''}${t.artist.name} - ${t.name} ${timeago.format(t.date.uts * 1000)}`).join('\n');

		embed.setDescription(description);

		return embed;
	})
		.setDescription('check what a user has been listening to on last.fm')
		.setGlobalCooldown(1500)
		.setUsage('(string)')
		.setDisplayUsage('(username)')
		.setCategory('last.fm'));
}