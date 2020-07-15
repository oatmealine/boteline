import * as CommandSystem from 'cumsystem';
import * as Discord from 'discord.js';
import * as util from '../lib/util';
import * as timeago from 'timeago.js';
import * as Paginator from '../lib/paginator';
const got = require('got');

const maxRecentPages = 5;
const resultsPerPage = 10;

export function addCommands(cs: CommandSystem.System) {
	let userAgent = cs.get('userAgent');
	let userData = cs.get('userData');

	cs.addCommand(new CommandSystem.SimpleCommand('nowplaying', async (msg, content) => {
		try {
			let username = content;
			if (content.length === 0 && userData[msg.author.id] && userData[msg.author.id].lastfm) {
				username = userData[msg.author.id].lastfm;
			}
			if (username.length === 0) `No account found! Either pass in a username or link your account with ${process.env.PREFIX}lastfm`;

			let res = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=1&extended=1&user=${encodeURI(username)}&api_key=${process.env.LASTFM_API_KEY}&format=json`, {'user-agent': userAgent});
			let data = JSON.parse(res.body);

			let playingTrack = data.recenttracks.track.find(t => t['@attr'] && t['@attr'].nowplaying === 'true');
			if (!playingTrack) return 'No track playing';

			// for pfp 
			let resUser = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${encodeURI(username)}&api_key=${process.env.LASTFM_API_KEY}&format=json`, {'user-agent': userAgent});
			let user = JSON.parse(resUser.body);

			// top tracks provides play amount and rank
			let resTopTracks = await got(`http://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${encodeURI(username)}&limit=100&api_key=${process.env.LASTFM_API_KEY}&format=json`, {'user-agent': userAgent});
			let topTracksData = JSON.parse(resTopTracks.body);
			let playingTrackExtended = topTracksData.toptracks.track.find(t => t.url === playingTrack.url);

			let embed = new Discord.MessageEmbed()
				.setTitle(`${playingTrack.loved === '1' ? '\\❤️ ' : ''}${playingTrack.artist.name} - ${playingTrack.name}`)
				.setThumbnail(playingTrack.image.pop()['#text'])
				.setTimestamp()
				.setURL(playingTrack.url)
				.setColor('#63de54')
				.setAuthor(user.user.name, user.user.image.pop()['#text'], user.user.url);

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
		.setUsage('[string]')
		.setDisplayUsage('[username]')
		.setCategory('last.fm'));

	cs.addCommand(new CommandSystem.Command('recent', async (msg, content) => {
		try {
			let username = content;
			if (content.length === 0 && userData[msg.author.id] && userData[msg.author.id].lastfm) {
				username = userData[msg.author.id].lastfm;
			}
			if (username.length === 0) return msg.channel.send(`No account found! Either pass in a username or link your account with ${process.env.PREFIX}lastfm`);

			let res = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&limit=${maxRecentPages * 10}&extended=1&user=${encodeURI(username)}&api_key=${process.env.LASTFM_API_KEY}&format=json`, {'user-agent': userAgent});
			let data = JSON.parse(res.body);

			let playingTrack = data.recenttracks.track.find(t => t['@attr'] && t['@attr'].nowplaying === 'true');
			let tracks = data.recenttracks.track.filter(t => t !== playingTrack); // filter out current track

			// for pfp 
			let resUser = await got(`http://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${encodeURI(username)}&api_key=${process.env.LASTFM_API_KEY}&format=json`, {'user-agent': userAgent});
			let user = JSON.parse(resUser.body);
			let pfp = user.user.image.pop()['#text'];
			let thumbnail;
			if (playingTrack) thumbnail = playingTrack.image.pop()['#text'];

			let paginator = new Paginator.Paginator((page) => {
				let embed = new Discord.MessageEmbed()
					.setTitle('Recent scrobbles')
					.setColor('#63de54')
					.setURL(user.user.url)
					.setAuthor(user.user.name, pfp, user.user.url)
					.setTimestamp()
					.addField('Total scrobbles', data.recenttracks['@attr'].total)
					.setFooter(`${page}/${paginator.limit}`);

				let description = '';

				if (playingTrack) {
					embed.setThumbnail(thumbnail);
					description += `**Scrobbling now**: ${playingTrack.loved === '1' ? '❤️ ' : ''}${playingTrack.artist.name} - ${playingTrack.name}\n\n`;
				}

				let off = (page - 1) * resultsPerPage;

				description += tracks.slice(0 + off, resultsPerPage + off).map((t, i) => `${i + 1 + off}. ${t.loved === '1' ? '❤️ ' : ''}${t.artist.name} - ${t.name} ${timeago.format(t.date.uts * 1000)}`).join('\n');

				embed.setDescription(description);

				return embed;
			}, msg.author);

			paginator.setLimit(Math.ceil(tracks.length / resultsPerPage));
			return paginator.start(msg.channel);
		} catch(err) {
			console.log(err);
			msg.channel.send(`error: ${err}`);
		}
	})
		.setDescription('check what a user has been listening to on last.fm')
		.setGlobalCooldown(1500)
		.setUsage('[string]')
		.setDisplayUsage('[username]')
		.setCategory('last.fm'));

	cs.addCommand(new CommandSystem.SimpleCommand('lastfm', (msg, content) => {
		if (!userData[msg.author.id]) userData[msg.author.id] = {};
		userData[msg.author.id].lastfm = content;
		return `Set your last.fm account name to \`${content}\``;
	})
		.setDescription('link your last.fm account')
		.setUsage('(string)')
		.setDisplayUsage('(username)')
		.setCategory('last.fm')
		.addAlias('fm'));
}