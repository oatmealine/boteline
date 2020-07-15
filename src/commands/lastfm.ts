import * as CommandSystem from 'cumsystem';
import * as Discord from 'discord.js';
import * as util from '../lib/util';
import * as timeago from 'timeago.js';
import * as Paginator from '../lib/paginator';
const got = require('got');

const maxRecentPages = 5;

export function addCommands(cs: CommandSystem.System) {
	let userAgent = cs.get('userAgent');

	cs.addCommand(new CommandSystem.SimpleCommand('nowplaying', async (msg, content) => {
		try {
			let res = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=1&extended=1&user=${encodeURI(content)}&api_key=${process.env.LASTFM_API_KEY}&format=json`, {'user-agent': userAgent});
			let data = JSON.parse(res.body);

			let playingTrack = data.recenttracks.track.find(t => t['@attr'] && t['@attr'].nowplaying === 'true');
			if (!playingTrack) return 'No track playing';

			// for pfp 
			let resUser = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${encodeURI(content)}&api_key=${process.env.LASTFM_API_KEY}&format=json`, {'user-agent': userAgent});
			let userData = JSON.parse(resUser.body);

			// top tracks provides play amount and rank
			let resTopTracks = await got(`http://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${encodeURI(content)}&limit=100&api_key=${process.env.LASTFM_API_KEY}&format=json`, {'user-agent': userAgent});
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
		} catch(err) {
			console.log(err);
			return `error: ${err}`;
		}
	})
		.addAlias('np')
		.setDescription('check what a user is playing on last.fm')
		.setGlobalCooldown(1500)
		.setUsage('(string)')
		.setDisplayUsage('(username)')
		.setCategory('last.fm'));

	cs.addCommand(new CommandSystem.Command('recent', async (msg, content) => {
		try {
			let res = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=${maxRecentPages * 10 + 1}&extended=1&user=${encodeURI(content)}&api_key=${process.env.LASTFM_API_KEY}&format=json`, {'user-agent': userAgent});
			let data = JSON.parse(res.body);

			let playingTrack = data.recenttracks.track.find(t => t['@attr'] && t['@attr'].nowplaying === 'true');
			let tracks = data.recenttracks.track.filter(t => t !== playingTrack); // filter out current track

			// for pfp 
			let resUser = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${encodeURI(content)}&api_key=${process.env.LASTFM_API_KEY}&format=json`, {'user-agent': userAgent});
			let userData = JSON.parse(resUser.body);
			let pfp = userData.user.image.pop()['#text'];
			let thumbnail;
			if (playingTrack) thumbnail = playingTrack.image.pop()['#text'];

			let paginator = new Paginator.Paginator((page) => {
				let embed = new Discord.MessageEmbed()
					.setTitle('Recent scrobbles')
					.setColor('#63de54')
					.setURL(userData.user.url)
					.setAuthor(userData.user.name, pfp, userData.user.url)
					.setTimestamp()
					.addField('Total scrobbles', data.recenttracks['@attr'].total)
					.setFooter(`${page}/${paginator.limit}`);

				let description = '';

				if (playingTrack) {
					embed.setThumbnail(thumbnail);
					description += `**Scrobbling now**: ${playingTrack.loved === '1' ? '❤️ ' : ''}${playingTrack.artist.name} - ${playingTrack.name}\n\n`;
				}

				let off = (page - 1) * 10;

				description += tracks.slice(0 + off, 10 + off).map((t, i) => `${i + 1 + off}. ${t.loved === '1' ? '❤️ ' : ''}${t.artist.name} - ${t.name} ${timeago.format(t.date.uts * 1000)}`).join('\n');

				embed.setDescription(description);

				return embed;
			}, msg.author);

			paginator.setLimit(maxRecentPages);
			paginator.start(msg.channel);
		} catch(err) {
			console.log(err);
			msg.channel.send(`error: ${err}`);
		}
	})
		.setDescription('check what a user has been listening to on last.fm')
		.setGlobalCooldown(1500)
		.setUsage('(string)')
		.setDisplayUsage('(username)')
		.setCategory('last.fm'));
}