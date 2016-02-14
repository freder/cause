'use strict';

const winston = require('winston');
const moment = require('moment');
const chalk = require('chalk');

const colorFunctions = {
	'info': chalk['green'],
	'warn': chalk['yellow'],
	'error': chalk['red'],
	'debug': chalk['gray']
};

function init() {
	winston.remove(winston.transports.Console);
	winston.add(winston.transports.Console, {
		timestamp: () => {
			return moment().format('DD-MM HH:mm:ss');
		},
		formatter: (msg) => {
			const m = {
				timestamp: chalk.gray(msg.timestamp()),
				level: colorFunctions[msg.level](msg.level[0]),
				message: msg.message
			};
			return `${m.timestamp} ${m.level}: ${m.message}`;
		},
		colorize: true
	});
	return winston;
}


module.exports = init();
