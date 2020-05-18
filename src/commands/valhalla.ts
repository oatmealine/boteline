import * as CommandSystem from 'cumsystem';
import * as util from '../lib/util';
import * as Discord from 'discord.js';
import * as fs from 'fs';

const valhallaDrinks = JSON.parse(fs.readFileSync('./src/valhalla.json', {encoding: 'utf8'}));

export function addCommands(cs: CommandSystem.System) {
	let logger = cs.get('logger');

	cs.addCommand(new CommandSystem.Command('valhalla', (msg) => {
		const params = util.getParams(msg);
		
		if (params[0] === 'search') {
			const foundDrinks: any[] = [];
			const search = params.slice(1, params.length).join(' ');
		
			valhallaDrinks.forEach((d) => {
				if (d.name.toLowerCase().includes(search.toLowerCase()) || d.flavour.toLowerCase() === search.toLowerCase()) {
					foundDrinks.push(d);
				} else {
					d.type.forEach((f) => {
						if (search.toLowerCase() === f.toLowerCase()) {
							foundDrinks.push(d);
						}
					});
				}
			});
		
			if (foundDrinks.length < 1) {
				msg.channel.send(`Found no matches for \`${params[1]}\``);
			} else if (foundDrinks.length === 1) {
				msg.channel.send('', util.makeDrinkEmbed(foundDrinks[0]));
			} else {
				let founddrinksstr = '\n';
				foundDrinks.slice(0, 5).forEach((d) => {
					founddrinksstr = founddrinksstr + '**' + d.name + '**\n';
				});
				if (foundDrinks.length > 5) {
					founddrinksstr = founddrinksstr + `..and ${foundDrinks.length - 5} more drinks`;
				}
		
				msg.channel.send(`Found ${foundDrinks.length} drinks:\n${founddrinksstr}`);
			}
		} else if (params[0] === 'make') {
			let adelhyde = 0;
			let bronsonExtract = 0;
			let powderedDelta = 0;
			let flangerine = 0;
			let karmotrine = 0;
		
			let blended = false;
			let aged = false;
			let iced = false;
		
			params[1].split('').forEach((i) => {
				switch (i) {
				case 'a':
					adelhyde += 1;
					break;
				case 'b':
					bronsonExtract += 1;
					break;
				case 'p':
					powderedDelta += 1;
					break;
				case 'f':
					flangerine += 1;
					break;
				case 'k':
					karmotrine += 1;
				}
			});
		
			blended = params.includes('blended');
			iced = params.includes('ice');
			aged = params.includes('aged');
		
			logger.debug(`${adelhyde}, ${bronsonExtract}, ${powderedDelta}, ${flangerine}, ${karmotrine}`);
			logger.debug(`${blended}, ${aged}, ${iced}`);
		
			let drink: boolean;
			let drinkBig: boolean;
		
			valhallaDrinks.forEach((d) => {
				if (adelhyde + bronsonExtract + powderedDelta + flangerine + karmotrine > 20) { return; }
		
				drinkBig = adelhyde / 2 === d.ingredients.adelhyde
							&& bronsonExtract / 2 === d.ingredients.bronson_extract
							&& powderedDelta / 2 === d.ingredients.powdered_delta
							&& flangerine / 2 === d.ingredients.flangerine
							&& (karmotrine / 2 === d.ingredients.karmotrine || d.ingredients.karmotrine === 'optional');
		
				if (adelhyde !== d.ingredients.adelhyde && (adelhyde / 2 !== d.ingredients.adelhyde || !drinkBig)) { return; }
				if (bronsonExtract !== d.ingredients.bronson_extract && (bronsonExtract / 2 !== d.ingredients.bronson_extract || !drinkBig)) { return; }
				if (powderedDelta !== d.ingredients.powdered_delta && (powderedDelta / 2 !== d.ingredients.powdered_delta || !drinkBig)) { return; }
				if (flangerine !== d.ingredients.flangerine && (flangerine / 2 !== d.ingredients.flangerine || !drinkBig)) { return; }
				if ((karmotrine !== d.ingredients.karmotrine && (karmotrine / 2 !== d.ingredients.karmotrine || !drinkBig)) && d.ingredients.karmotrine !== 'optional') { return; }
		
				if (blended !== d.blended) { return; }
				if (aged !== d.aged) { return; }
				if (iced !== d.iced) { return; }
		
				drink = d;
			});
		
			msg.channel.send(':timer: **Making drink...**').then((editmsg) => {
				if (editmsg instanceof Discord.Message)
					cs.client.setTimeout(() => {
						if (drink === undefined) {
							editmsg.edit('Failed to make drink!');
						} else {
							editmsg.edit('Successfully made drink!' + (drinkBig ? ' (its big too, woah)' : ''), util.makeDrinkEmbed(drink));
						}
					}, blended ? 7000 : 3000);
			});
		}
	})
		.setCategory('fun')
		.addAlias('va11halla')
		.setUsage('(string) (string) [string] [string] [string]')
		.setDisplayUsage('valhalla ((search) (drink name) | (make) (ingredients marked by their first letter) [mixed?] [on the rocks?] [aged?])')
		.addExample('search Frothy Water')
		.addExample('make abpf aged')
		.addExample('make aabbbbppffffkkkkkkkk')
		.setDescription('search up drinks, and make some drinks, va11halla style!\nbasically a text-based replica of the drink making part of va11halla'));
		
}