const chalk = require('chalk')
let showDebug = false;

function formattedDate() {
	const date = new Date();

	function addDigit(num) {
		num = num.toString();
		if (num.length === 1) {
			num = '0' + num;
		}
		return num;
	}

	const hours = addDigit(date.getHours());
	const minutes = addDigit(date.getMinutes());
	const seconds = addDigit(date.getSeconds());

	return ('[' + hours + ':' + minutes + ':' + seconds + ']').bold + ' ';
}

module.exports = {
	log: console.log,
	info(str: string)    {console.info (chalk.blue  (formattedDate() + ('ℹ ' + str))); },
	success(str: string) {console.log  (chalk.green (formattedDate() + ('✓ ' + str))); },
	warning(str: string) {console.log  (chalk.yellow(formattedDate() + ('⚠ ' + str))); },
	error(str: string)   {console.log  (chalk.red   (formattedDate() + ('⚠ ' + str))); },

	debug(str: string) {
		if (showDebug) {
			console.debug(chalk.cyan(formattedDate() + ('ℹ ' + str)));
		}
	},
	showDebug(bool: boolean) {
		showDebug = bool;
	},
};
