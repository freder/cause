'use strict';

const winston = require('winston');
const moment = require('moment');
const chalk = require('chalk');

const colorFunctions = {
	info: chalk.green,
	warn: chalk.yellow,
	error: chalk.red,
	debug: chalk.gray
};

function init() {
	winston.remove(winston.transports.Console);
	winston.add(winston.transports.Console, {
		timestamp: () => {
			return moment().format('DD-MM HH:mm:ss');
		},
		formatter: (_msg) => {
			const msg = {
				timestamp: chalk.gray(_msg.timestamp()),
				level: colorFunctions[_msg.level](_msg.level[0]),
				message: _msg.message
			};
			return `${msg.timestamp} ${msg.level}: ${msg.message}`;
		},
		colorize: true
	});
	return winston;
}


module.exports = init();
