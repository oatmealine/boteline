import * as Discord from 'discord.js';
import * as CommandSystem from 'cumsystem';
import { createCanvas, loadImage } from 'canvas';
import * as discordutil from '../lib/discord';

Discord;

class CanvasGradientApplyCommand extends CommandSystem.Command {
	public gradient: string[];
	public bottomstring: string;

	constructor(name: string, gradient: string[], bottomstring: string, bot: Discord.Client) {
		super(name, null);

		this.bottomstring = bottomstring;
		this.gradient = gradient;

		this.addClientPermission('ATTACH_FILES');
		this.setUsage('[user]');

		this.cfunc = (msg: Discord.Message) => {
			msg.channel.startTyping();
			let params = discordutil.getParams(msg);

			const canvas = createCanvas(300, 390);
			const ctx = canvas.getContext('2d');

			let user = params.length === 0 ? msg.author : discordutil.parseUser(bot, params[0], msg.guild);

			if (user === null) {
				msg.channel.send('User not found');
				return;
			}

			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, 300, 390);

			let displayname = user.username;
			if (msg.guild && msg.guild.members.cache.get(user.id)) {
				displayname = msg.guild.members.cache.get(user.id).displayName;
			}

			ctx.font = '30px Impact';
			ctx.fillStyle = 'white';
			ctx.textAlign = 'center';
			ctx.fillText(displayname.toUpperCase() + ' is ' + bottomstring, 150, 340 + 15);

			loadImage(user.displayAvatarURL({format: 'png'})).then((image) => {
				ctx.drawImage(image, 10, 10, 280, 280);

				ctx.strokeStyle = 'white';
				ctx.lineWidth = 4;
				ctx.strokeRect(10, 10, 280, 280);

				let ctxGradient = ctx.createLinearGradient(0, 10, 0, 290);

				gradient.forEach((clr, i, arr) => {
					ctxGradient.addColorStop(i / (arr.length - 1), clr);
				});

				ctx.fillStyle = ctxGradient;

				ctx.fillRect(10, 10, 280, 280);

				msg.channel.send('', { files: [canvas.toBuffer()] }).then(() => {
					msg.channel.stopTyping();
				});
			});
		};
		return this;
	}
}

export function addCommands(cs: CommandSystem.System) {
	cs.addCommand(new CanvasGradientApplyCommand('gay',
		['rgba(255,0,0,0.5)',
			'rgba(255,127,0,0.5)',
			'rgba(255,255,0,0.5)',
			'rgba(0,255,0,0.5)',
			'rgba(0,255,255,0.5)',
			'rgba(0,0,255,0.5)',
			'rgba(255,0,255,0.5)'],
		'GAY', cs.client)
		.setCategory('image')
		.setDescription('puts a gay (homosexual) flag over your (or someone else\'s) icon')
		.addAlias('gayoverlay')
		.setGlobalCooldown(100)
		.setUserCooldown(1000)
		.setHidden());

	cs.addCommand(new CanvasGradientApplyCommand('trans',
		['rgba(85,205,252,0.6)',
			'rgba(247,168,184,0.6)',
			'rgba(255,255,255,0.6)',
			'rgba(247,168,184,0.6)',
			'rgba(85,205,252,0.6)'],
		'TRANS', cs.client)
		.setCategory('image')
		.setDescription('puts a trans (transgender) flag over your (or someone else\'s) icon')
		.addAlias('transoverlay')
		.setGlobalCooldown(100)
		.setUserCooldown(1000)
		.setHidden());

	cs.addCommand(new CanvasGradientApplyCommand('bi',
		['rgba(214,2,112,0.6)',
			'rgba(214,2,112,0.6)',
			'rgba(155,79,150,0.6)',
			'rgba(0,56,168,0.6)',
			'rgba(0,56,168,0.6)'],
		'BI', cs.client)
		.setCategory('image')
		.setDescription('puts a bi (bisexual) flag over your (or someone else\'s) icon')
		.addAlias('bioverlay')
		.setGlobalCooldown(100)
		.setUserCooldown(1000)
		.setHidden());

	cs.addCommand(new CanvasGradientApplyCommand('enby',
		['rgba(255,244,51,0.6)',
			'rgba(255,255,255,0.6)',
			'rgba(155,89,208,0.6)',
			'rgba(0,0,0,0.6)'],
		'ENBY', cs.client)
		.setCategory('image')
		.setDescription('puts an enby (non-binary) flag over your (or someone else\'s) icon')
		.addAlias('enbyoverlay')
		.setGlobalCooldown(100)
		.setUserCooldown(1000)
		.setHidden());

	cs.addCommand(new CanvasGradientApplyCommand('pan',
		['rgba(255, 27, 141,0.6)',
			'rgba(255, 218, 0,0.6)',
			'rgba(27, 179, 255,0.6)'],
		'PAN', cs.client)
		.setCategory('image')
		.setDescription('puts a pan (pansexual) flag over your (or someone else\'s) icon')
		.addAlias('panoverlay')
		.setGlobalCooldown(100)
		.setUserCooldown(1000)
		.setHidden());

	cs.addCommand(new CanvasGradientApplyCommand('ace',
		['rgba(0, 0, 0,0.6)',
			'rgba(127, 127, 127,0.6)',
			'rgba(255, 255, 255,0.6)',
			'rgba(102, 0, 102,0.6)'],
		'ASEXUAL', cs.client)
		.setCategory('image')
		.setDescription('puts a ace (asexual) flag over your (or someone else\'s) icon')
		.addAlias('aceoverlay')
		.setGlobalCooldown(100)
		.setUserCooldown(1000)
		.setHidden());

	cs.addCommand(new CanvasGradientApplyCommand('lesbian',
		['rgba(214, 41, 0,0.6)',
			'rgba(255, 155, 85,0.6)',
			'rgba(255, 255, 255,0.6)',
			'rgba(212, 97, 166,0.6)',
			'rgba(165, 0, 98,0.6)'],
		'LESBIAN', cs.client)
		.setCategory('image')
		.setDescription('puts a lesbian flag over your (or someone else\'s) icon')
		.addAlias('lesbianoverlay')
		.setGlobalCooldown(100)
		.setUserCooldown(1000)
		.setHidden());
}