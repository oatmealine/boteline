import * as CommandSystem from 'cumsystem';
import * as Discord from 'discord.js';
import * as ffmpeg from 'fluent-ffmpeg';
import * as util from '../lib/util';

let logger;

class FFMpegCommand extends CommandSystem.Command {
	public inputOptions: Function;
	public outputOptions: Function;

	constructor(name: string, inputOptions, outputOptions?) {
		super(name, null);

		this.inputOptions = inputOptions;
		this.outputOptions = outputOptions || (() => []);

		this.cfunc = async (msg) => {
			const params = util.getParams(msg);
			const attachments = [];

			if (msg.attachments.size === 0) {
				await msg.channel.messages.fetch({ limit: 20 }).then((msges) => {
					msges.array().forEach((m: Discord.Message) => {
						if (m.attachments.size > 0) {
							m.attachments.array().forEach((att) => {
								attachments.push(att);
							});
						}
					});
				});
			} else {
				attachments.push(msg.attachments.first());
			}

			if (attachments.length > 0) {
				let videoAttach: Discord.MessageAttachment;

				attachments.forEach((attachment) => {
					if (videoAttach || !attachment) { return; }

					const filetype = attachment.name.split('.').pop();
					const acceptedFiletypes = ['apng', 'webm', 'swf', 'wmv', 'mp4', 'flv', 'm4a'];

					if (acceptedFiletypes.includes(filetype.toLowerCase())) {
						videoAttach = attachment;
					}
				});

				if (videoAttach) {
					let progMessage: Discord.Message;
					let lastEdit = 0; // to avoid ratelimiting

					msg.channel.send('ok, downloading...').then((m) => {
						if (m instanceof Discord.Message)
							progMessage = m;
					});
					msg.channel.startTyping();

					if (params[0]) {
						if (params[0].startsWith('.') || params[0].startsWith('/') || params[0].startsWith('~')) {
							if (progMessage) {
								progMessage.edit('i know exactly what you\'re doing there bud');
							} else {
								msg.channel.send('i know exactly what you\'re doing there bud');
							}
						}
					}

					ffmpeg()
						.input(videoAttach.url)
						//.input(this.addInput(msg))
						.inputOptions(this.inputOptions(msg))
						.outputOptions(this.outputOptions(msg))
						.on('start', (commandLine) => {
							logger.info('started ffmpeg with command: ' + commandLine);
							if (progMessage) {
								progMessage.edit('processing: 0% (0s) done');
							}
						})
						.on('stderr', (stderrLine) => {
							logger.verbose('ffmpeg: ' + stderrLine);
						})
						.on('progress', (progress) => {
							if (lastEdit + 2000 < Date.now() && progMessage) {
								lastEdit = Date.now();
								progMessage.edit(`processing: **${progress.percent !== undefined ? Math.floor(progress.percent * 100) / 100 : '0.00'}%** \`(${progress.timemark})\``);
							}
						})
						.on('error', (err) => {
							msg.channel.stopTyping();
							logger.warn('ffmpeg failed!');
							if (progMessage) {
								progMessage.edit(`processing: error! \`${err}\``);
							} else {
								msg.channel.send(`An error has occured!: \`${err}\``);
							}
						})
						.on('end', () => {
							msg.channel.stopTyping();
							if (progMessage) {
								progMessage.edit('processing: done! uploading');
							}
							msg.channel.send('ok, done', { files: ['./temp/temp.mp4'] }).then(() => {
								if (progMessage) {
									progMessage.delete();
								}
							});
						})
						// .pipe(stream);
						.save('./temp/temp.mp4');
				} else {
					msg.channel.send('No video attachments found');
				}
			} else {
				msg.channel.send('No attachments found');
			}
		};
		return this;
	}
}

export function addCommands(cs: CommandSystem.System) {
	logger = cs.get('logger');

	cs.addCommand('video', new FFMpegCommand('compress', () => [], (msg) => {
		const params = util.getParams(msg);
		if (!params[0]) { params[0] = '20'; }
		return [`-b:v ${Math.abs(Number(params[0]))}k`, `-b:a ${Math.abs(Number(params[0]) - 3)}k`, '-c:a aac'];
	})
		.setDescription('compresses a video')
		.addAlias('compression')
		.setUsage('[number]')
		.addClientPermission('ATTACH_FILES')
		.setGlobalCooldown(1000)
		.setUserCooldown(5000));

	cs.addCommand('video', new FFMpegCommand('arabic', () => [], () => {
		let arabicText = '';
	
		// to generate the text we just take random arabic characters and mash them together
		for (let i = 0; i < Math.floor(Math.random() * 20 + 5); i++) {
			// arabic characters range from around 1547 to 1957. i just chose a smaller range of the ones that look the most Funy
			arabicText += String.fromCharCode(1550 + Math.floor(Math.random() * 410));
		}

		return [
			// replace audio with nokia.mp3
			'-i ./assets/nokia.mp3',
			'-map 0:v:0', '-map 1:a:0',
			// add Da Text
			`-vf "drawtext=\\"fontfile=./node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf: text='${arabicText}': fontcolor=black: fontsize=140: box=1: boxcolor=white: x=(w-text_w)/2: y=0\\""`,
			// bitrate
			'-b:v 40k', '-b:a 40k',
			// framerate
			'-framerate 2',
			// trim the video
			'-shortest'
		];
	}));
}