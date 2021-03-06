// eslint-disable-next-line no-unused-vars
import { System } from 'cumsystem';

import * as booru from './booru';
import * as coin from './coin';
import * as color from './color';
import * as convert from './convert';
import * as core from './core';
import * as corona from './corona';
import * as debug from './debug';
import * as fun from './fun';
import * as gay from './gay';
import * as info from './info';
import * as lastfm from './lastfm';
import * as minecraft from './minecraft';
import * as minesweeper from './minesweeper';
import * as moderation from './moderation';
import * as splatoon from './splatoon';
import * as starboard from './starboard';
import * as translate from './translate';
import * as urban from './urban';
import * as utilities from './utilities';
import * as valhalla from './valhalla';
import * as video from './video';
import * as weather from './weather';

export function addCommands(cs: System) {
	let modules = [booru, coin, color, convert, core, corona, debug, fun, gay, info, lastfm, minecraft, minesweeper, moderation, splatoon, starboard, translate, urban, utilities, valhalla, video, weather];

	modules.forEach(m => {
		m.addCommands(cs);
	});
}