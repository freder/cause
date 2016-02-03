'use strict';

const chalk = require('chalk');


module.exports.f1 =
function(s) {
	return chalk.magenta(s);
};

module.exports.f2 =
function(s) {
	return chalk.bgMagenta.black(s);
};

module.exports.f3 =
function(s) {
	return chalk.bgMagenta.white(s);
};
