import * as rq from 'request';
import * as Discord from 'discord.js';
import * as foxconsole from './foxconsole.js';

const cache = {
  'splatoon': {
    timer: new Date(0),
    data: {}
  },
  'salmon': {
    timer: new Date(0),
    data: {}
  }
};

export function progress(prog: number, max: number, len: number = 10) : string {
  return '█'.repeat(Math.floor((prog / max) * len)) + '_'.repeat(len - (prog / max) * len);
}

export function makeDrinkEmbed(drink: any) : Discord.RichEmbed {
  const embed = new Discord.RichEmbed({
    title: drink.name,
    fields: [
      {
        name: 'Description',
        value: '"' + drink.blurb + '"',
      },
      {
        name: 'Flavor',
        value: drink.flavour,
        inline: true,
      },
      {
        name: 'Type',
        value: drink.type.join(', '),
        inline: true,
      },
      {
        name: 'Price',
        value: '$' + drink.price,
        inline: true,
      },
      {
        name: 'Preparation',
        value: `A **${drink.name}** is **${drink.ingredients.adelhyde}** Adelhyde, **${drink.ingredients.bronson_extract}** Bronson Extract, **${drink.ingredients.powdered_delta}** Powdered Delta, **${drink.ingredients.flangerine}** Flangerine ${drink.ingredients.karmotrine === 'optional' ? 'with *(optional)*' : `and **${drink.ingredients.karmotrine}**`} Karmotrine. All ${drink.aged ? `aged${drink.iced ? ', ' : ' and '}` : ''}${drink.iced ? 'on the rocks and ' : ''}${drink.blended ? 'blended' : 'mixed'}.`,
      },
    ],
    footer: { text: 'CALICOMP 1.1' }
  }).setColor([255, 0, 255]);
  return embed;
}

export function hashCode(str: string) : number {
  let hash = 0, i, chr;
  if (str.length === 0) { return hash; }
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

export function getParams(message: Discord.Message) : string[] {
  return message.content.split(' ').slice(1, message.content.length);
}

export function roundNumber(num: number, decimals: number) {
  return Math.round(num*Math.pow(10, decimals))/Math.pow(10, decimals);
}

export function normalDistribution(x: number) : number {
  return Math.pow(Math.E, (-Math.PI * x * x));
}

export function seedAndRate(str: string) : number {
  const exclusions = {boteline: 0, mankind: 0, fox: 10, thefox: 10};

  if (Object.keys(str).includes('str')) {
    return exclusions[str];
  } else {
    const hc = Math.abs(hashCode(str));
    return Math.round(normalDistribution(hc % 0.85) * 10);
  }
}

export function checkSplatoon() : Promise<any> {
  return new Promise(resolve => {
    if (cache.splatoon !== undefined) {
      if (cache.splatoon.timer.getHours() >= new Date().getHours() && new Date(cache.splatoon.timer.getTime()+1200000) >= new Date()) {
        resolve(cache.splatoon);
        return;
      }
    }

    foxconsole.debug('fetching splatoon2.ink data...');
    rq('https://splatoon2.ink/data/schedules.json', {
      'user-agent': 'Boteline (oatmealine#1704)'
    }, (err, response, body) => {
      foxconsole.debug('got code '+response.statusCode);
      if (response.statusCode === 200 && !err) {
        foxconsole.debug('done!');
        cache.splatoon.data = JSON.parse(body);
        cache.splatoon.timer = new Date();
        resolve(cache.splatoon);
      } else {
        foxconsole.warning('failed to fetch splatoon2.ink data, using potentially outdated data');
        resolve(cache.splatoon);
      }
    });
  });
}

export function checkSalmon() : Promise<any> {
  return new Promise(resolve => {
    if (cache.salmon !== undefined) {
      if (cache.salmon.timer.getHours() >= new Date().getHours() && new Date(cache.salmon.timer.getTime()+1200000) >= new Date()) {
        resolve(cache.salmon);
        return;
      }
    }

    foxconsole.debug('fetching splatoon2.ink data...');
    rq('https://splatoon2.ink/data/coop-schedules.json', {
      'user-agent': 'Boteline (oatmealine#1704)'
    }, (err, response, body : string) => {
      foxconsole.debug('got code '+response.statusCode);
      if (response.statusCode === 200 && !err) {
        foxconsole.debug('done!');
        cache.salmon.data = JSON.parse(body);
        cache.salmon.timer = new Date();
        resolve(cache.salmon);
      } else {
        foxconsole.warning('failed to fetch splatoon2.ink data, using potentially outdated data');
        resolve(cache.salmon);
      }
    });
  });
}

export function formatTime(date : Date) : string {
  let hours = date.getUTCHours();
  let minutes = date.getUTCMinutes();

  return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes} UTC`;
}