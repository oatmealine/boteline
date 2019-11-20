const chalk = require('chalk');

function formattedDate() : string {
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

  return chalk.bold(('[' + hours + ':' + minutes + ':' + seconds + ']')) + ' ';
}

export function info(str: string) {console.info (chalk.blue  (formattedDate() + ('ℹ ' + str))); }
export function	success(str: string) {console.log  (chalk.green (formattedDate() + ('✓ ' + str))); }
export function	warning(str: string) {console.log  (chalk.yellow(formattedDate() + ('⚠ ' + str))); }
export function	error(str: string)   {console.log  (chalk.red   (formattedDate() + ('⚠ ' + str))); }

export let debugdisp = false;
export function	debug(str: string) {if (debugdisp) console.debug(chalk.cyan(formattedDate() + ('ℹ ' + str))); }
export function showDebug(bool: boolean) {debugdisp = bool; }