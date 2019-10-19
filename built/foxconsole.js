"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require('chalk');
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
    return chalk.bold(('[' + hours + ':' + minutes + ':' + seconds + ']')) + ' ';
}
function info(str) { console.info(chalk.blue(formattedDate() + ('ℹ ' + str))); }
exports.info = info;
;
function success(str) { console.log(chalk.green(formattedDate() + ('✓ ' + str))); }
exports.success = success;
;
function warning(str) { console.log(chalk.yellow(formattedDate() + ('⚠ ' + str))); }
exports.warning = warning;
;
function error(str) { console.log(chalk.red(formattedDate() + ('⚠ ' + str))); }
exports.error = error;
;
exports.debugdisp = false;
function debug(str) { if (exports.debugdisp)
    console.debug(chalk.cyan(formattedDate() + ('ℹ ' + str))); }
exports.debug = debug;
;
function showDebug(bool) { exports.debugdisp = bool; }
exports.showDebug = showDebug;
;
