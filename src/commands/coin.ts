import * as CommandSystem from 'cumsystem';
import * as fs from 'fs';
import * as Discord from 'discord.js';
import * as discordutil from '../lib/discord';
import * as util from '../lib/util';

const coinValue = JSON.parse(util.readIfExists('./data/coinvalue.json', { encoding: 'utf8' }, '{"value": 3, "direction": "up", "strength": 0.2, "speed": 2, "remaining": 4, "pastvalues": []}'));
const schlattCoinValue = JSON.parse(util.readIfExists('./data/schlattcoinvalue.json', { encoding: 'utf8' }, '{"value": 3, "direction": "up", "strength": 0.2, "speed": 2, "remaining": 4, "pastvalues": []}'));

let guildSettings;
let userData;

let lastCoinUpdateDate = Date.now();

function updateCoins(cs: CommandSystem.System, save = true) {
	cs.get('logger').verbose('updating coin values');

	lastCoinUpdateDate = Date.now();

	/*
		 sample coin data:
		 {
			 "value": 3,
			 "direction": "up",
			 "strength": 0.25,
			 "speed": 0.2
			 "remaining": 4,
			 "pastvalues": [],
			 "weirdCrashing": false
		 }

		 value is the value of the coin in USD
		 direction is where the chart is currently moving, a string equal to either 'up' or 'down'
		 strength is a value from 0 to 1 determening how likely the chart is to go in the opposite direction each update
		 speed is by how much the value will increase each update
		 remaining is how much guaranteed updates are left before the graph switches direction
		 pastvalues is an array of the past 10 values
		 weirdcrashing is a schlattcoin-only value that determines if the value is crashing in a fucked-up way
		*/

	// boteline coins
	coinValue.pastvalues.push(coinValue.value);
	if (coinValue.pastvalues.length > 40) {
		coinValue.pastvalues.shift();
	} else {
		updateCoins(cs, false);
	}

	let oppositeDir = (dir) => {
		if (dir === 'up') return 'down';
		return 'up';
	};

	let direction = Math.random() < coinValue.strength ? oppositeDir(coinValue.direction) : coinValue.direction; // if the strength is low enough, the higher the chance itll go the opposite direction

	let speed = coinValue.speed;
	if (direction !== coinValue.direction) // randomize the speed if its going in an incorrect way
		speed = Math.random() * 3 + 1;

	let increaseAmount = speed * (direction === 'up' ? 1 : -1); // the final calculated amount to increase the coin by

	coinValue.value += increaseAmount;
	coinValue.remaining--;

	if (coinValue.remaining <= 0) {
		coinValue.remaining = Math.ceil(Math.random() * 4);
		coinValue.direction = Math.random() >= 0.5 ? 'up' : 'down';
		coinValue.speed = Math.random() * 23 + 10;
		coinValue.strength = Math.random() * 0.3 + 0.1;
	}

	if (Math.random() > 0.998) { // the economy has a really rare chance of crashing! :o
		schlattCoinValue.direction = 'down';
		schlattCoinValue.remaining = 4;
		schlattCoinValue.strength = 0.2;
		schlattCoinValue.speed = Math.random() * 8 + 30;
	}

	if (Math.random() > 0.999) { // and a really rare chance of rising to heck
		schlattCoinValue.direction = 'up';
		schlattCoinValue.remaining = 3;
		schlattCoinValue.strength = 0.2;
		schlattCoinValue.speed = Math.random() * 7 + 30;
	}

	if (coinValue.value < 0) { // just incase this ever DOES happen
		coinValue.value = Math.abs(coinValue.value);
		coinValue.remaining = 2;
		coinValue.direction = 'up';
	}

	if (coinValue.value > 20000) // i hope this never happens but i mean you never know
		coinValue.direction = 'down';

	// schlatt coins
	schlattCoinValue.pastvalues.push(schlattCoinValue.value);
	if (schlattCoinValue.pastvalues.length > 40) {
		schlattCoinValue.pastvalues.shift();
	} else {
		updateCoins(cs, false);
	}

	direction = Math.random() < schlattCoinValue.strength ? oppositeDir(schlattCoinValue.direction) : schlattCoinValue.direction; // if the strength is low enough, the higher the chance itll go the opposite direction

	speed = schlattCoinValue.speed;
	if (direction !== schlattCoinValue.direction) // randomize the speed if its going in an incorrect way
		speed = Math.random() * 30 + 10;

	increaseAmount = speed * (direction === 'up' ? 1 : -1); // the final calculated amount to increase the coin by

	schlattCoinValue.value += increaseAmount;
	schlattCoinValue.remaining--;

	if (schlattCoinValue.remaining <= 0 && !schlattCoinValue.weirdCrashing) {
		schlattCoinValue.remaining = Math.ceil(Math.random() * 5) + 1;
		schlattCoinValue.direction = Math.random() >= 0.55 ? 'up' : 'down';
		schlattCoinValue.speed = Math.random() * 30 + 12;
		schlattCoinValue.strength = Math.random() * 0.6 + 0.2;
	}

	if (Math.random() > 0.96) { // the economy has a really rare chance of crashing! :o
		schlattCoinValue.direction = 'down';
		schlattCoinValue.remaining = 5;
		schlattCoinValue.strength = 0.1;
		schlattCoinValue.speed = Math.random() * 50 + 60;
	}

	if (Math.random() > 0.99) { // and a really rare chance of rising to heck
		schlattCoinValue.direction = 'up';
		schlattCoinValue.remaining = 2;
		schlattCoinValue.strength = 0.1;
		schlattCoinValue.speed = Math.random() * 30 + 30;
	}

	if (schlattCoinValue.value > 400 && Math.random() > 0.99) {
		schlattCoinValue.weirdCrashing = true;
		schlattCoinValue.remaining = Math.round(Math.random()) + 1;
	}

	if (schlattCoinValue.weirdCrashing) {
		schlattCoinValue.speed = schlattCoinValue.value / 2 + 10;
		schlattCoinValue.strength = 0;
		schlattCoinValue.direction = 'down';

		if (schlattCoinValue.value < 5 || schlattCoinValue.remaining <= 0) schlattCoinValue.weirdCrashing = false;
	}

	if (schlattCoinValue.value < 0) { // just incase this ever DOES happen
		schlattCoinValue.value = Math.abs(schlattCoinValue.value);
	}

	if (schlattCoinValue.value > 30000) // i hope this never happens but i mean you never know
		schlattCoinValue.direction = 'down';

	schlattCoinValue.value = util.roundNumber(schlattCoinValue.value, 5);
	coinValue.value = util.roundNumber(coinValue.value, 5);

	Object.values(guildSettings).forEach((v: any) => {
		if (v.watchChannel && cs.client.channels.cache.get(v.watchChannel)) {
			let channel = cs.client.channels.cache.get(v.watchChannel);
			if (channel instanceof Discord.TextChannel) {
				cs.commands.find(c => c.name === 'cchart')
					.cfunc(new Discord.Message( // janky solution but it should work
						cs.client,
						{
							content: cs.prefix + 'cchart',
							author: cs.client,
							embeds: [],
							attachments: new Discord.Collection(),
							createdTimestamp: 0,
							editedTimestamp: 0
						},
						channel
					), '');
			}
		}
	});

	if (save) {
		fs.writeFile('./data/coinvalue.json', JSON.stringify(coinValue), (err) => {
			if (err) {
				console.error('failed saving coinvalue: ' + err);
			}
		});
		fs.writeFile('./data/schlattcoinvalue.json', JSON.stringify(schlattCoinValue), (err) => {
			if (err) {
				console.error('failed saving coinvalue: ' + err);
			}
		});
	}
}

export function addCommands(cs: CommandSystem.System) {
	cs.client.on('ready', () => {
		cs.client.setInterval(() => {
			updateCoins(cs);
		}, 110000);
	});

	guildSettings = cs.get('guildSettings');
	userData = cs.get('userData');

	cs.addCommand(new CommandSystem.SimpleCommand('cinit', msg => {
		if (!userData[msg.author.id]) userData[msg.author.id] = {};

		userData[msg.author.id].invest = {
			balance: 100,
			invested: 0, // how much the user has invested
			investstartval: 0, // how much coins were worth back then
			investeds: 0, // schlattcoin
			investstartvals: 0
		};

		return 'created/reset an account for you!';
	})
		.setCategory('coin')
		.setHidden()
		.setDescription('create an account for boteline coin commands'));

	cs.addCommand(new CommandSystem.SimpleCommand('cbal', msg => {
		if (!userData[msg.author.id] || !userData[msg.author.id].invest) return 'you dont have an account! create a new one with `cinit`';
		let user = userData[msg.author.id].invest;
		let returnstring = '';

		returnstring += `Your balance is: ${util.roundNumber(user.balance, 3)}$ (= ${util.roundNumber(user.balance / coinValue.value, 2)}BC = ${util.roundNumber(user.balance / schlattCoinValue.value, 2)}SC)\n`;
		if (user.invested === 0) {
			returnstring += 'You don\'t have any boteline coins!\n';
		} else {
			returnstring += `You have ${util.roundNumber(user.invested, 4)}BC (= ${util.roundNumber(user.invested * coinValue.value, 2)}$)\n`;
			let profit = util.roundNumber((coinValue.value - user.investstartval) / user.investstartval * 100, 2);
			let profitusd = util.roundNumber((coinValue.value - user.investstartval) * user.invested, 2);

			returnstring += `The value has gone up by ${profit}% since you last bought BC (profited ${profitusd}$)\n`;
		}

		if (user.investeds === 0 || !user.investeds) {
			returnstring += 'You don\'t have any schlattcoin!\n';
		} else {
			returnstring += `You have ${util.roundNumber(user.investeds, 4)}SC (= ${util.roundNumber(user.investeds * schlattCoinValue.value, 2)}$)\n`;
			let profit = util.roundNumber((schlattCoinValue.value - user.investstartvals) / user.investstartvals * 100, 2);
			let profitusd = util.roundNumber((schlattCoinValue.value - user.investstartvals) * user.investeds, 2);

			returnstring += `The value has gone up by ${profit}% since you last bought SC (profited ${profitusd}$)\n`;
		}

		return returnstring;
	})
		.setCategory('coin')
		.setHidden()
		.setDescription('check your balance'));

	cs.addCommand(new CommandSystem.SimpleCommand('cval', () => {
		let chartem = coinValue.value < coinValue.pastvalues[coinValue.pastvalues.length - 1] ? ':chart_with_downwards_trend:' : ':chart_with_upwards_trend:';
		let chartemsch = schlattCoinValue.value < schlattCoinValue.pastvalues[schlattCoinValue.pastvalues.length - 1] ? ':chart_with_downwards_trend:' : ':chart_with_upwards_trend:';
		return `1BC is currently worth ${util.roundNumber(coinValue.value, 2)}$ ${chartem}
1SC is currently worth ${util.roundNumber(schlattCoinValue.value, 2)}$ ${chartemsch}
(boteline coins/schlattcoin are not a real currency/cryptocurrency!)
The values should be updated in ${util.roundNumber((110000 - (Date.now() - lastCoinUpdateDate)) / 1000, 1)}s`;
	})
		.setCategory('coin')
		.setHidden()
		.setDescription('check the coin values'));

	cs.addCommand(new CommandSystem.SimpleCommand('cbuy', msg => {
		if (!userData[msg.author.id] || !userData[msg.author.id].invest) return 'you dont have an account! create a new one with `cinit`';
		let user = userData[msg.author.id].invest;
		const params = discordutil.getParams(msg);
		let invmoney = Number(params[0]) * coinValue.value;

		if (user.balance <= 0) return 'you have no money in your account! create a new one with `cinit` (bankrupt fuck)';
		if (params[0] === 'all') {
			params[0] = String(user.balance);
			invmoney = user.balance;
		}
		if (Number(params[0]) != Number(params[0].replace('$', ''))) {
			params[0] = params[0].replace('$', '');
			invmoney = Number(params[0]);
		}
		if (isNaN(Number(params[0])) && isNaN(invmoney)) return 'that isn\'t a number!';
		if (user.balance < invmoney) return 'you dont have enough money in your account!';
		if (invmoney <= 0) return 'you cant buy that little!';

		userData[msg.author.id].invest.balance = user.balance - invmoney;
		userData[msg.author.id].invest.invested = user.invested + invmoney / coinValue.value;
		userData[msg.author.id].invest.investstartval = coinValue.value;

		return `bought ${util.roundNumber(invmoney / coinValue.value, 2)}BC (${util.roundNumber(invmoney, 2)}$)`;
	})
		.setCategory('coin')
		.setDescription('buy an amount of boteline coins, use `all` to buy as many as possible')
		.setUsage('(string)')
		.setHidden()
		.setDisplayUsage('(coin amount, or dollars)')
		.addAlias('cinv'));

	cs.addCommand(new CommandSystem.SimpleCommand('csell', msg => {
		if (!userData[msg.author.id] || !userData[msg.author.id].invest) return 'you dont have an account! create a new one with `cinit`';
		const params = discordutil.getParams(msg);
		let user = userData[msg.author.id].invest;

		if (user.invested === 0) return 'you havent bought any coins yet!';
		if (params[0] === 'all') params[0] = String(user.invested);
		if (isNaN(Number(params[0]))) return 'that isn\'t a number!';
		if (Number(params[0]) > user.invested) return 'you dont have that much coins!';
		if (Number(params[0]) <= 0) return 'you can\'t sell that little!';

		let profit = Number(params[0]) * coinValue.value;

		userData[msg.author.id].invest.balance = user.balance + profit;
		userData[msg.author.id].invest.invested = user.invested - Number(params[0]);

		return `you sold ${params[0]}bc for ${util.roundNumber(profit, 2)}$! your balance is now ${util.roundNumber(userData[msg.author.id].invest.balance, 2)}$`;
	})
		.setCategory('coin')
		.setDescription('sell your boteline coins, use `all` to sell every single one you have')
		.setUsage('(string)')
		.setHidden()
		.setDisplayUsage('(coins)'));

	cs.addCommand(new CommandSystem.SimpleCommand('cbuys', msg => {
		if (!userData[msg.author.id] || !userData[msg.author.id].invest) return 'you dont have an account! create a new one with `cinit`';
		let user = userData[msg.author.id].invest;
		const params = discordutil.getParams(msg);
		let invmoney = Number(params[0]) * schlattCoinValue.value;

		if (user.balance <= 0) return 'you have no money in your account! create a new one with `cinit` (bankrupt fuck)';
		if (params[0] === 'all') {
			params[0] = String(user.balance);
			invmoney = user.balance;
		}
		if (Number(params[0]) != Number(params[0].replace('$', ''))) {
			params[0] = params[0].replace('$', '');
			invmoney = Number(params[0]);
		}
		if (Number(params[0]) != Number(params[0].replace('%', ''))) {
			params[0] = params[0].replace('%', '');
			invmoney = Number(params[0]) / 100 * user.balance;
		}
		if (isNaN(Number(params[0])) && isNaN(invmoney)) return 'that isn\'t a number!';
		if (user.balance < invmoney) return 'you dont have enough money in your account!';
		if (invmoney <= 0) return 'you cant buy that little!';

		userData[msg.author.id].invest.balance = user.balance - invmoney;
		userData[msg.author.id].invest.investeds = user.investeds + invmoney / schlattCoinValue.value;
		userData[msg.author.id].invest.investstartvals = schlattCoinValue.value;

		return `bought ${util.roundNumber(invmoney / schlattCoinValue.value, 2)}SC (${util.roundNumber(invmoney, 2)}$)`;
	})
		.setCategory('coin')
		.setDescription('buy an amount of schlattcoin, use `all` to buy as many as possible')
		.setUsage('(string)')
		.setHidden()
		.setDisplayUsage('(coin amount, percentage, or dollars)')
		.addAlias('cinv'));

	cs.addCommand(new CommandSystem.SimpleCommand('csells', msg => {
		if (!userData[msg.author.id] || !userData[msg.author.id].invest) return 'you dont have an account! create a new one with `cinit`';
		const params = discordutil.getParams(msg);
		let user = userData[msg.author.id].invest;

		if (user.investeds === 0) return 'you havent bought any coins yet!';
		if (params[0] === 'all') params[0] = String(user.investeds);
		if (isNaN(Number(params[0]))) return 'that isn\'t a number!';
		if (Number(params[0]) > user.investeds) return 'you dont have that much coins!';
		if (Number(params[0]) <= 0) return 'you can\'t sell that little!';

		let profit = Number(params[0]) * schlattCoinValue.value;

		userData[msg.author.id].invest.balance = user.balance + profit;
		userData[msg.author.id].invest.investeds = user.investeds - Number(params[0]);

		return `you sold ${params[0]}SC for ${util.roundNumber(profit, 2)}$! your balance is now ${util.roundNumber(userData[msg.author.id].invest.balance, 2)}$`;
	})
		.setCategory('coin')
		.setDescription('sell your schlattcoin, use `all` to sell every single one you have')
		.setUsage('(string)')
		.setHidden()
		.setDisplayUsage('(coins)'));

	cs.addCommand(new CommandSystem.Command('cchart', msg => {
		msg.channel.startTyping();

		let bcchartdata = {
			type: 'line',
			data: {
				labels: Array(coinValue.pastvalues.length + 1).fill(''),
				datasets: [
					{
						label: 'Boteline Coins',
						data: coinValue.pastvalues.concat([coinValue.value]),
						fill: false,
						borderColor: 'red',
						borderWidth: 3,
						pointRadius: 0
					},
					{
						label: 'Schlattcoin',
						data: schlattCoinValue.pastvalues.concat([schlattCoinValue.value]),
						fill: false,
						borderColor: 'blue',
						borderWidth: 3,
						pointRadius: 0
					}
				]
			},
			options: {
				title: {
					display: true,
					text: 'Coin Values',
					fontColor: 'black',
					fontSize: 32
				},
				legend: {
					position: 'bottom'
				}
			}
		};

		msg.channel.send({
			files: [{
				attachment: 'https://quickchart.io/chart?bkg=white&c=' + encodeURI(JSON.stringify(bcchartdata)),
				name: 'look-at-this-graph.png'
			}]
		}).then(m => { if (m instanceof Discord.Message) m.channel.stopTyping(); });
	})
		.setCategory('coin')
		.setDescription('view coin history via a chart')
		.addClientPermission('ATTACH_FILES')
		.setHidden()
		.setGlobalCooldown(1500));

	cs.addCommand(new CommandSystem.Command('ctop', msg => {
		let leaderboard = Object.keys(userData)
			.filter(a => userData[a].invest)
			.sort(
				(a, b) =>
					userData[b].invest.balance -
          userData[a].invest.balance
			)
			.slice(0, 9)
			.map((u, i) =>
				`${i + 1}. ${cs.client.users.cache.get(u) || '???'} - ${util.roundNumber(userData[u].invest.balance, 2)}$`
			)
			.join('\n');

		let embed = new Discord.MessageEmbed()
			.setTitle('rich leaderboards')
			.setFooter('rich fucks')
			.setColor('FFFF00')
			.setDescription(leaderboard);

		msg.channel.send(embed);
	})
		.setCategory('coin')
		.setHidden());

	cs.addCommand(new CommandSystem.SimpleCommand('cwatch', msg => {
		if (!guildSettings[msg.guild.id]) guildSettings[msg.guild.id] = {};

		guildSettings[msg.guild.id].watchChannel = msg.channel.id;

		return 'done, will now log all updates here';
	})
		.setCategory('coin')
		.setDescription('send all updates to the current channel, use unwatch to stop')
		.setGlobalCooldown(5000)
		.addUserPermission('MANAGE_CHANNELS')
		.setHidden()
		.setGuildOnly());

	cs.addCommand(new CommandSystem.SimpleCommand('cunwatch', msg => {
		if (!guildSettings[msg.guild.id]) guildSettings[msg.guild.id] = {};

		delete guildSettings[msg.guild.id].watchChannel;

		return 'done, will now stop loging all updates';
	})
		.setCategory('coin')
		.setDescription('stop sending all updates to this guild\'s update channel')
		.setGlobalCooldown(2000)
		.addUserPermission('MANAGE_CHANNELS')
		.setHidden()
		.setGuildOnly());
}