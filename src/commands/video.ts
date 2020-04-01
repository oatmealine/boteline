import * as CommandSystem from 'cumsystem';
import * as Discord from 'discord.js';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as util from '../lib/util';
import * as bufferSplit from 'buffer-split';
const got = require('got');

const videoFormats = ['apng', 'webm', 'swf', 'wmv', 'mp4', 'flv', 'm4a', 'avi', 'mkv', 'mp3', 'wav', 'ogg', 'mov'];
const editTimeout = 2500;

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
			util.fetchAttachment(msg, videoFormats)
				.then(videoAttach => {
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
							if (lastEdit + editTimeout < Date.now() && progMessage) {
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
							msg.channel.send('', { files: ['./temp/temp.mp4'] }).then(() => {
								if (progMessage) {
									progMessage.delete();
								}
							});
						})
						// .pipe(stream);
						.save('./temp/temp.mp4');
				})
				.catch(err => {
					msg.channel.send(`Error: \`${err}\``);
				});
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
		/*let arabicText = '';
	
		// to generate the text we just take random arabic characters and mash them together
		for (let i = 0; i < Math.floor(Math.random() * 20 + 5); i++) {
			// arabic characters range from around 1547 to 1957. i just chose a smaller range of the ones that look the most Funy
			arabicText += String.fromCharCode(1550 + Math.floor(Math.random() * 410));
		}*/

		return [
			// replace audio with nokia.mp3
			'-i ./assets/nokia.mp3',
			'-map 0:v:0', '-map 1:a:0',
			// add Da Text
			// doesnt work so commented out for now : (
			//`-vf "drawtext=\\"fontfile=./node_modules/dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf: text='${arabicText}': fontcolor=black: fontsize=140: box=1: boxcolor=white: x=(w-text_w)/2: y=0\\""`,
			// framerate (i use this instead of -r because else it would extend the video beyond 25 seconds)
			'-filter:v fps=fps=2',
			// bitrate
			'-b:v 30k', '-b:a 20k',
			// trim the video
			'-shortest'
		];
	}));

	cs.addCommand('video', new CommandSystem.Command('datamosh', async (msg) => {
		const progMessage = await msg.channel.send('downloading video...');
		let lastEdit = 0;

		util.fetchAttachment(msg, videoFormats)
			.then(async (videoAttach) => {
				if (videoAttach.name.split('.').pop() !== 'avi') {
					if (progMessage) progMessage.edit('converting to avi...');

					await (() => {
						return new Promise(resolve => {
							ffmpeg(videoAttach.url)
								.on('start', (commandLine) => {
									logger.info('started ffmpeg with command: ' + commandLine);
									if (lastEdit + editTimeout < Date.now() && progMessage) {
										progMessage.edit('converting to avi: **0%** `(00:00:00)` done');
									}
								})
								.on('stderr', (stderrLine) => {
									logger.verbose('ffmpeg: ' + stderrLine);
								})
								.on('progress', (progress) => {
									if (lastEdit + editTimeout < Date.now() && progMessage) {
										lastEdit = Date.now();
										progMessage.edit(`converting to avi: **${progress.percent !== undefined ? Math.floor(progress.percent * 100) / 100 : '0.00'}%** \`(${progress.timemark})\``);
									}
								})
								.on('error', (err) => {
									logger.warn('ffmpeg failed!');
									throw err;
								})
								.on('end', () => {
									if (lastEdit + editTimeout < Date.now() && progMessage) {
										progMessage.edit('converting to avi: done! gonna start ACTUALLY processing now');
									}

									resolve();
								})
								.save('./temp/tempIn.avi');
						});
					})();
				} else {
					await got(videoAttach.url)
						.then(response => {
							fs.writeFileSync('./temp/tempIn.avi', response.body);
						})
						.catch(err => {
							throw err;
						});
				}

				// by now ./temp/tempIn.avi should be a real file, but you cant be too sure with jill's code

				if(!fs.existsSync('./temp/tempIn.avi')) throw new Error('!!! what !!!\nsomething went colossally wrong, and the temp file doesnt exist. what the fuck. WHAT FUCK.');

				let aviFileBytes = fs.readFileSync('./temp/tempIn.avi');

				const frameEnd = Buffer.from('30306463', 'hex');
				const iframeStart = Buffer.from('0001B0', 'hex');

				let frames = bufferSplit(aviFileBytes, frameEnd);
				let newAviFileBytes = Buffer.from('');
				let doneFrames = 0;

				frames.forEach((frame: Buffer, i, arr) => {
					if ((frame.includes(iframeStart)) && doneFrames > 2) {
						newAviFileBytes = Buffer.concat([newAviFileBytes, arr[i - 1], frameEnd]);
					} else {
						newAviFileBytes = Buffer.concat([newAviFileBytes, frame, frameEnd]);
					}

					if (lastEdit + editTimeout < Date.now() && progMessage) {
						lastEdit = Date.now();
						progMessage.edit(`destroying avi... frame ${doneFrames}/${frames.length}`);
					}

					doneFrames++;
				});

				fs.writeFileSync('./temp/temp.avi', newAviFileBytes);

				ffmpeg('./temp/temp.avi')
					.on('start', (commandLine) => {
						logger.info('started ffmpeg with command: ' + commandLine);
						if (lastEdit + editTimeout < Date.now() && progMessage) {
							progMessage.edit('converting to mp4: **0%** `(00:00:00)` done');
						}
					})
					.on('stderr', (stderrLine) => {
						logger.verbose('ffmpeg: ' + stderrLine);
					})
					.on('progress', (progress) => {
						if (lastEdit + editTimeout < Date.now() && progMessage) {
							lastEdit = Date.now();
							progMessage.edit(`converting to mp4: **about ${progress.percent !== undefined ? Math.floor(progress.percent * 100) / 100 : '0.00'}%??** (very inaccurate due to header corruption) \`(${progress.timemark})\``);
						}
					})
					.on('error', (err) => {
						logger.warn('ffmpeg failed!');
						throw err;
					})
					.on('end', async () => {
						if (progMessage) {
							progMessage.edit('converting to mp4: done! uploading...');
						}

						await msg.channel.send({files: ['./temp/temp.mp4']});

						progMessage.delete();
					})
					.save('./temp/temp.mp4');
			})
			.catch((err: Error) => {
				logger.warn(err.message);
				if (progMessage) {
					progMessage.edit(`error!!: ${err.message}`);
				} else {
					msg.channel.send(`error!!: ${err.message}`);
				}
			});
	})
		.setDescription('apply datamoshing effects to a video (aka remove the i-frames)')
		.setGlobalCooldown(5000)
		.setUserCooldown(6000));
}