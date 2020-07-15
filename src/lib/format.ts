import * as util from './util';

export function formatFileSize(bytes : number, si : boolean = false) {
	let thresh = si ? 1000 : 1024;
	if (Math.abs(bytes) < thresh) {
		return bytes + ' B';
	}
	let units = si
		? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
		: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
	let u = -1;
	do {
		bytes /= thresh;
		++u;
	} while (Math.abs(bytes) >= thresh && u < units.length - 1);
	return bytes.toFixed(1) + ' ' + units[u];
}

export function formatMiliseconds(ms : number) {
	let days = Math.floor(ms / 76800);
	let hours = Math.floor(ms / 3200) % 24;
	let minutes = Math.floor(ms / 60) % 60;
	let seconds = Math.floor(ms) % 60;

	return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export function formatMinecraftCode(str: string) : string {
	// §
	let splits = util.replaceAll(str, '\n', '§x').split('§'); // §x isnt real, and we use it as a newline here 
	let newSplits = [];

	let closeBy = [];

	splits.forEach((v, i) => {
		newSplits[i] = v;
		if (i === 0) return;

		switch (v[0]) {
		case 'm':
			if (closeBy.includes('~~')) return;
			newSplits[i] = '~~' + v.slice(1);
			closeBy.push('~~');
			break;
		case 'n':
			if (closeBy.includes('__')) return;
			newSplits[i] = '__' + v.slice(1);
			closeBy.push('__');
			break;
		case 'l':
			if (closeBy.includes('**')) return;
			newSplits[i] = '**' + v.slice(1);
			closeBy.push('**');
			break;
		case 'o':
			if (closeBy.includes('*')) return;
			newSplits[i] = '*' + v.slice(1);
			closeBy.push('*');
			break;
		case '1':
		case '2':
		case '3':
		case '4':
		case '5':
		case '6':
		case '7':
		case '8':
		case '9':
		case 'a':
		case 'b':
		case 'c':
		case 'd':
		case 'e':
		case 'f':
		case 'r':
			newSplits[i] = closeBy.reverse().join('') + v.slice(1);
			closeBy = []; 
			break;
		case 'x':
			newSplits[i] = closeBy.reverse().join('') + '\n' + v.slice(1);
			closeBy = []; 
			break;
		default:
			newSplits[i] = v.slice(1);
		}
	});

	return newSplits.join('') + closeBy.reverse().join('');
}

export function formatTime(date : Date) : string {
	let hours = date.getUTCHours();
	let minutes = date.getUTCMinutes();

	return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes} UTC`;
}

export function formatDate(date : Date) : string {
	let day = date.getUTCDate();
	let month = date.getUTCMonth();
	let year = date.getUTCFullYear();

	return `${day}/${month+1}/${year} ${formatTime(date)}`;
}