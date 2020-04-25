import * as CommandSystem from 'cumsystem';
import * as Discord from 'discord.js';
import * as ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs';
import * as util from '../lib/util';
import * as bufferSplit from 'buffer-split';
import * as os from 'os';
const got = require('got');

const videoFormats = ['apng', 'webm', 'swf', 'wmv', 'mp4', 'flv', 'm4a', 'avi', 'mov', 'gif'];
const editTimeout = 2500;

const temp = os.tmpdir();

function genName() {
	let nameChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	return Array(15).fill('').map(() => nameChars[Math.floor(Math.random() * nameChars.length)]).join('');
}

let logger;

class FFMpegCommand extends CommandSystem.Command {
	public inputOptions: Function;
	public outputOptions: Function;
	public format: string;

	constructor(name: string, inputOptions, outputOptions?, format = 'mp4') {
		super(name, null);

		this.inputOptions = inputOptions;
		this.outputOptions = outputOptions || (() => []);
		this.format = format;

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

					let log = '';
					let tempFile = temp + '/' + genName() + '.' + format;

					ffmpeg()
						.input(videoAttach.url)
						//.input(this.addInput(msg))
						.inputOptions(this.inputOptions(msg))
						.outputOptions(this.outputOptions(msg))
						.on('start', (commandLine) => {
							logger.debug('started ffmpeg with command: ' + commandLine);
							if (progMessage) {
								progMessage.edit('processing: 0% (0s) done');
							}
						})
						.on('stderr', stderrLine => {
							log += '\n' + stderrLine;
						})
						.on('progress', (progress) => {
							if (lastEdit + editTimeout < Date.now() && progMessage) {
								lastEdit = Date.now();
								progMessage.edit(`processing: **${progress.percent !== undefined ? Math.floor(progress.percent * 100) / 100 : '0.00'}%** \`(${progress.timemark})\`
\`\`\`
${log.split('\n').slice(Math.max(-4, -log.split('\n').length))}
\`\`\``);
							}
						})
						.on('error', (err) => {
							msg.channel.stopTyping();
							logger.error('ffmpeg failed!: ' + err);
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
							msg.channel.send('', { files: [tempFile] }).then(() => {
								if (progMessage) {
									progMessage.delete();
								}
							});
						})
						// .pipe(stream);
						.save(tempFile);
				})
				.catch(err => {
					msg.channel.send(`Error: \`${err}\``);
				});
		};
		return this;
	}

	setDescription(desc: string) {
		this.description = '_This command will fetch input from above messages, putting links as arguments won\'t work!_\n' + desc;
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
	})
		.setDescription('(arabic text here)')
		.setGlobalCooldown(1000)
		.setUserCooldown(3000)
		.addClientPermission('ATTACH_FILES'));

	cs.addCommand('video', new FFMpegCommand('togif', () => [], () => [], 'gif')
		.setDescription('turns a video into an animated gif')
		.setGlobalCooldown(1000)
		.setUserCooldown(3000)
		.addClientPermission('ATTACH_FILES'));

	cs.addCommand('video', new FFMpegCommand('tomp4', () => [], () => [], 'mp4')
		.setDescription('turns a video or gif to an mp4 format video')
		.setGlobalCooldown(500)
		.setUserCooldown(2000)
		.addClientPermission('ATTACH_FILES'));

	cs.addCommand('video', new CommandSystem.Command('datamosh', async (msg) => {
		const params = util.getParams(msg);

		let intensity = 0.2;
		if (params[0]) intensity = Number(params[0]);
		
		const progMessage = await msg.channel.send('downloading video...');
		let lastEdit = 0;

		util.fetchAttachment(msg, videoFormats)
			.then(async (videoAttach) => {
				let tempFileIn = temp + '/' + genName() + '.avi';

				if (videoAttach.url.split('.').pop() !== 'avi') {
					if (progMessage) progMessage.edit('converting to avi...');

					await (() => {
						return new Promise(resolve => {
							let log = '';

							ffmpeg(videoAttach.url)
								.on('start', (commandLine) => {
									logger.debug('started ffmpeg with command: ' + commandLine);
								})
								.on('stderr', stderrLine => {
									log += '\n' + stderrLine;
								})
								.on('progress', (progress) => {
									if (lastEdit + editTimeout < Date.now() && progMessage) {
										lastEdit = Date.now();
										progMessage.edit(`converting to avi: **${progress.percent !== undefined ? Math.floor(progress.percent * 100) / 100 : '0.00'}%** \`(${progress.timemark})\`
\`\`\`
${log.split('\n').slice(Math.max(-4, -log.split('\n').length))}
\`\`\``);
									}
								})
								.on('end', () => {
									resolve();
								})
								.save(tempFileIn);
						});
					})();
				} else {
					await got(videoAttach.url)
						.then(response => {
							fs.writeFileSync(tempFileIn, response.body);
						})
						.catch(err => {
							logger.error('downloading failed: ' + err);
							if (progMessage) progMessage.edit('downloading failed: ' + err);
						});
				}

				// by now it should be a real file, but you cant be too sure with jill's code

				if(!fs.existsSync(tempFileIn)) throw new Error('!!! what !!! something went colossally wrong, and the temp file doesnt exist. what the fuck. WHAT FUCK.');

				let aviFileBytes = fs.readFileSync(tempFileIn);

				const frameEnd = Buffer.from('30306463', 'hex');
				const iframeStart = Buffer.from('0001B0', 'hex');

				let frames = bufferSplit(aviFileBytes, frameEnd);
				
				if (frames.length > 7000) throw new Error('Too many frames (the hard limit is on about 7000 frames)');

				logger.debug(`loaded ${frames.length} frames`);

				let newAviFileBytes = Buffer.from('');
				let doneFrames = 0;

				// decide a timeline for repeated frame replacement

				let replaceFramesArr = [];

				let replacing = false;
				let replacementEnd = 0;

				for (let i = 0; i < frames.length; i++) {
					replaceFramesArr[i] = false;
					
					if (i - replacementEnd > (1-intensity) * 100 && Math.random() > 1-intensity && !replacing) {
						replacing = true;
						replacementEnd = i + Math.floor(Math.random() * 25) + 3;
					}

					if (replacing) {
						if (i < replacementEnd) {
							replaceFramesArr[i] = true;
						} else {
							replacing = false;
						}
					}
				}

				let occasionalReplaceInterval = (1-intensity) * 1000;
				let occasionalReplaceThreshold = occasionalReplaceInterval - intensity * 10;

				frames.forEach((frame: Buffer, i, arr) => {
					if ((frame.includes(iframeStart) || i % occasionalReplaceInterval > occasionalReplaceThreshold || replaceFramesArr[i]) && doneFrames > 5) {
						let previousFrame = arr[i - 1];
						if (bufferSplit(newAviFileBytes, frameEnd)[i - 1]) previousFrame = bufferSplit(newAviFileBytes, frameEnd)[i - 1];
						newAviFileBytes = Buffer.concat([newAviFileBytes, previousFrame, frameEnd]);
					} else {
						newAviFileBytes = Buffer.concat([newAviFileBytes, frame, frameEnd]);
					}

					if (lastEdit + editTimeout < Date.now() && progMessage) {
						lastEdit = Date.now();
						progMessage.edit(`destroying avi... frame ${doneFrames}/${frames.length}`);
					}

					doneFrames++;
				});

				let tempFileAvi = temp + '/' + genName() + '.avi';

				fs.writeFileSync(tempFileAvi, newAviFileBytes);

				let warnings = 0;
				let previousLineWarning = false;
				let log = '';

				let tempFileOutput = temp + '/' + genName() + '.mp4';

				ffmpeg(tempFileAvi)
					.on('start', (commandLine) => {
						logger.debug('started ffmpeg with command: ' + commandLine);
					})
					.on('stderr', stderrLine => {
						log += '\n' + stderrLine;

						if (stderrLine.trim().startsWith('Last message repeated') && previousLineWarning) {
							let times = stderrLine.trim().split(' ')[3];
							if (isNaN(times)) warnings += times;

							return;
						}

						if (stderrLine.startsWith('[mp3float')) {
							warnings++;
							previousLineWarning = true;
							return;
						}

						previousLineWarning = false;
					})
					.on('progress', (progress) => {
						if (lastEdit + editTimeout < Date.now() && progMessage) {
							lastEdit = Date.now();
							progMessage.edit(`converting to mp4: **about ${progress.percent !== undefined ? Math.floor(progress.percent * 100) / 100 : '0.00'}%??** (very inaccurate due to header corruption) \`(${progress.timemark})\` ${warnings} :warning:
\`\`\`
${log.split('\n').slice(Math.max(-4, -log.split('\n').length))}
\`\`\``);
						}
					})
					.on('end', async () => {
						if (progMessage) {
							progMessage.edit('converting to mp4: done! uploading...');
						}

						await msg.channel.send(`${warnings} :warning: (the more, the better)`, {files: [tempFileOutput]});

						progMessage.delete();
					})
					.save(tempFileOutput);
			})
			.catch((err: Error) => {
				logger.error(err.stack);
				if (progMessage) {
					progMessage.edit(`error!!: ${err.message}`);
				} else {
					msg.channel.send(`error!!: ${err.message}`);
				}
			});
	})
		.setDescription('apply datamoshing effects to a video (aka remove the i-frames and repeat previous ones)\nintensity ranges from 0 to 1, ex. 0 just removes i frames, 1 completely obliterates the video')
		.setUsage('[number]')
		.setDisplayUsage('[intensity]')
		.addAlias('dm')
		.setGlobalCooldown(4000)
		.setUserCooldown(7000));
}