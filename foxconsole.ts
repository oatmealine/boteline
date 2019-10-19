require('colors');
let showDebug = false;

function formattedDate() {
	let date = new Date();

	function addDigit(num) {
		num = num.toString();
		if (num.length === 1) {
			num = '0' + num;
		}
		return num;
	}

	let hours = addDigit(date.getHours());
	let minutes = addDigit(date.getMinutes());
	let seconds = addDigit(date.getSeconds());

	return ('[' + hours + ':' + minutes + ':' + seconds + ']').bold + ' ';
}

module.exports = {
	log: console.log,
	info: function(str: string)    {console.info (formattedDate() + ('ℹ ' + str).blue   );},
	success: function(str: string) {console.log  (formattedDate() + ('✓ ' + str).green );},
	warning: function(str: string) {console.log  (formattedDate() + ('⚠ ' + str).yellow);},
	error: function(str: string)   {console.log  (formattedDate() + ('⚠ ' + str).red   );},

	debug: function(str: string) {
		if (showDebug) {
			console.debug(formattedDate() + ('ℹ ' + str).cyan);
		}
	},
	showDebug: function(bool: boolean) {
		showDebug = bool;
	}
};