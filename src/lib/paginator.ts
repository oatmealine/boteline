import * as Discord from 'discord.js';
Discord; // i love ts

interface PaginatorButton {
	emote: string;
	callback?: Function;
	endPaginator?: boolean;
	callUpdate?: boolean;
}

export class Paginator {
	count = 1;
	limit = 0;
	working = false; // this is a very terrible variable name
	// should be renamed to ongoing but im too lazy

	func: Function;
	author: Discord.User;
	buttons: PaginatorButton[];

	message: Discord.Message;
	collector: Discord.ReactionCollector;

	/**
	 * Make a paginator, startable by Paginator.start()
	 * @param func The function to run after the counter has changed or a button has been told to update
	 * @param startedBy The user who started the paginator
	 * @param buttons Buttons to add alongside the paginator scrollers
	 * @param removeDefaultButtons Whether the paginator should remove the default counter buttons
	 */
	constructor(func: Function, startedBy: Discord.User, buttons?: PaginatorButton[], removeDefaultButtons = false) {
		this.func = func;
		this.author = startedBy;

		this.buttons = [{
			emote: '◀️',
			callUpdate: true,
			callback: () => {
				this.count--;
			}
		},
		{
			emote: '⏹️',
			endPaginator: true,
			callback: () => {
				this.remove();
			}
		},
		{
			emote: '▶️',
			callUpdate: true,
			callback: () => {
				this.count++;
			}
		}];

		if (removeDefaultButtons) this.buttons = [];
		if (buttons) buttons.forEach(b => this.buttons.push(b));
	}

	/**
	 * Sets a limit to the counter
	 * @param count The limit, 0 to disable
	 */
	setLimit(count: number) {
		this.limit = count;
	}

	/**
	 * Starts the paginator
	 * @param channel The channel in which to post it to
	 */
	async start(channel: Discord.TextChannel | Discord.DMChannel | Discord.NewsChannel) {
		this.working = true;
		this.message = await channel.send(await this.func(this.count));
		this.collector = this.message.createReactionCollector((r, u) => 
			u.id === this.author.id && this.buttons.map(b => b.emote).includes(r.emoji.name),
		{time: 30000}
		)
			.on('collect', (r, u) => {
				let button = this.buttons.find(b => b.emote === r.emoji.name);
				if (button) {
					this.buttonPushed(button);
					r.users.remove(u);
				}
			})
			.on('dispose', (r, u) => { // incase the bot doesnt have manage message perms to make scrolling faster
				if (u.id === r.message.author.id) return;
				
				let button = this.buttons.find(b => b.emote === r.emoji.name);
				if (button) {
					this.buttonPushed(button);
				}
			})
			.on('end', () => {
				this.end();
			});

		for (let b of this.buttons)
			await this.message.react(b.emote);
	}

	/**
	 * Delete the paginator's message and stop it
	 */
	async remove() {
		this.working = false;
		this.collector.stop();
		await this.message.delete();
	}

	/**
	 * Stop accepting reactions for the paginator
	 */
	async end() {
		this.working = false;
		this.collector.stop();
		try {
			await this.message.reactions.removeAll();
		} catch(err) {
			this.message.reactions.cache.forEach(r => {
				if (r.me) r.users.remove();
			});
		}
	}

	async update() {
		if (!this.working) throw new Error('Paginator not started!');

		// limit number to 1 and above
		this.count = Math.abs(this.count);
		this.count = Math.max(this.count, 1);

		if (this.limit > 0) this.count = Math.min(this.count, this.limit);

		await this.message.edit(await this.func(this.count));
	}

	async buttonPushed(button: PaginatorButton) {
		if (!this.working) throw new Error('Paginator not started!');

		let res;
		if (button.callback) res = await button.callback(this.count);

		if (res) await this.message.edit(res);

		if (button.endPaginator) {
			await this.end();
		} else {
			if (button.callUpdate) await this.update();
		}
	}
}

export function autoSplit(message: Discord.Message, content: string, amt = 1024, startWith = '', endWith = '') {
	if (content.length > amt) {
		let paginator = new Paginator((count) => {
			let off = (count - 1) * amt;
			return startWith + content.slice(0 + off, amt + off) + endWith + `\n${count}/${paginator.limit}`;
		}, message.author);

		paginator.setLimit(Math.ceil(content.length / amt));
		paginator.start(message.channel);
	} else {
		message.channel.send(startWith + content + endWith).then(m => {
			m.react('❌');
			m.createReactionCollector((e, u) => e.emoji.name === '❌' && u.id === message.author.id, {time: 15000})
				.on('collect', () => {
					m.delete();
				})
				.on('end', () => {
					m.reactions.cache.forEach(r => r.users.remove());
				});
		});
	}
}