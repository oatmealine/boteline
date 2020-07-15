
import * as fs from 'fs';

export function progress(prog: number, max: number, len: number = 10) : string {
	return '█'.repeat(Math.floor((prog / max) * len)) + '_'.repeat(len - (prog / max) * len);
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

export function readIfExists(path : fs.PathLike, options? : {encoding?: string | null, flag?: string}, ifNonExistant? : any) {
	if (fs.existsSync(path)) {
		return fs.readFileSync(path, options);
	} else {
		return ifNonExistant;
	}
}

export function shortenStr(str: string, chars: number) {
	if (str.length > chars)
		return str.substr(0, chars - 3).trimRight() + '...';

	return str;
}

export function decimalToNumber(num) : string {
	switch (num) {
	case 1: return 'one'; break;
	case 2: return 'two'; break;
	case 3: return 'three'; break;
	case 4: return 'four'; break;
	case 5: return 'five'; break;
	case 6: return 'six'; break;
	case 7: return 'seven'; break;
	case 8: return 'eight'; break;
	case 9: return 'nine'; break;
	case 0: return 'zero'; break;
	}

	return 'zero';
}

export function replaceUrbanLinks(str : string) {
	let pat = /\[(.+?)\]/g;
	return str.replace(pat, (_, link) => {
		return `[${link}](https://www.urbandictionary.com/define.php?term=${encodeURI(link)})`;
	});
}

export function objectFlip(obj) : Object {
	const ret = {};
	Object.keys(obj).forEach(key => {
		ret[obj[key]] = key;
	});
	return ret;
}

export function replaceAll(str: string, match: string, replace = '') : string {
	return str.split(match).join(replace);
}

export function rankNum(num: number) {
	let suffixes = ['th', 'st', 'nd', 'rd', 'th'];
	let digit = Math.floor(Math.abs(num % 10));
	let suffix = suffixes[Math.min(digit, suffixes.length - 1)];
	if (num % 100 > 10 && num % 100 < 20) suffix = 'th';
	return `${num}${suffix}`;
}