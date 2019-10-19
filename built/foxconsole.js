require('colors');
var showDebug = false;
function formattedDate() {
    var date = new Date();
    function addDigit(num) {
        num = num.toString();
        if (num.length === 1) {
            num = '0' + num;
        }
        return num;
    }
    var hours = addDigit(date.getHours());
    var minutes = addDigit(date.getMinutes());
    var seconds = addDigit(date.getSeconds());
    return ('[' + hours + ':' + minutes + ':' + seconds + ']').bold + ' ';
}
module.exports = {
    log: console.log,
    info: function (str) { console.info(formattedDate() + ('ℹ ' + str).blue); },
    success: function (str) { console.log(formattedDate() + ('✓ ' + str).green); },
    warning: function (str) { console.log(formattedDate() + ('⚠ ' + str).yellow); },
    error: function (str) { console.log(formattedDate() + ('⚠ ' + str).red); },
    debug: function (str) {
        if (showDebug) {
            console.debug(formattedDate() + ('ℹ ' + str).cyan);
        }
    },
    showDebug: function (bool) {
        showDebug = bool;
    }
};
