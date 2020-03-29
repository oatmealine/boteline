import * as util from '../lib/util';
import * as CommandSystem from 'cumsystem';

// wikimedia api
let wiki, wikimc, wikiterraria;

export function addCommands(cs: CommandSystem.System) {
	let logger = cs.get('logger');

	try {
		let Wikiapi = require('wikiapi');

		wiki = new Wikiapi('en');
		wikimc = new Wikiapi('https://minecraft.gamepedia.com/api.php');
		wikiterraria = new Wikiapi('https://terraria.gamepedia.com/api.php');
	} catch (err) {
		logger.warning('wikiapi returned error: ' + err);
	}

	if (wiki) {
		cs.addCommand('wiki', new CommandSystem.Command('wiki', async msg => {
			const params = util.getParams(msg);
			let page_data = await wiki.page(params.join(' '));

			if (page_data.wikitext < 1) {
				msg.channel.send('page not found!');
			} else {
				msg.channel.send(`https://en.wikipedia.org/wiki/${encodeURI(page_data.title.split(' ').join('_'))}`);
			}
		})
			.addExample('Cock and ball torture')
			.setDescription('looks up an article in Wikipedia')
			.setUsage('(string)')
			.setDisplayUsage('(artcle)')
			.setGlobalCooldown(500)
			.addAlias('wikipedia'));
	}

	if (wikimc) {
		cs.addCommand('wiki', new CommandSystem.Command('mcwiki', async msg => {
			const params = util.getParams(msg);
			let page_data = await wikimc.page(params.join(' '));

			if (page_data.wikitext < 1) {
				msg.channel.send('page not found!');
			} else {
				msg.channel.send(`https://minecraft.gamepedia.com/${encodeURI(page_data.title.split(' ').join('_'))}`);
			}
		})
			.addExample('Bee')
			.setDescription('looks up an article in the minecraft gamepedia')
			.setUsage('(string)')
			.setDisplayUsage('(artcle)')
			.setGlobalCooldown(500));
	}

	if (wikiterraria) {
		cs.addCommand('wiki', new CommandSystem.Command('terrariawiki', async msg => {
			const params = util.getParams(msg);
			let page_data = await wikiterraria.page(params.join(' '));

			if (page_data.wikitext < 1) {
				msg.channel.send('page not found!');
			} else {
				msg.channel.send(`https://terraria.gamepedia.com/${encodeURI(page_data.title.split(' ').join('_'))}`);
			}
		})
			.addExample('Slime')
			.setDescription('looks up an article in the terraria gamepedia')
			.setUsage('(string)')
			.setDisplayUsage('(artcle)')
			.setGlobalCooldown(500));
	}
}