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

const init =
module.exports.init =
function init(socketServer) {
	winston.remove(winston.transports.Console);
	winston.add(winston.transports.Console, {
		timestamp: () => {
			return moment().format('DD-MM HH:mm:ss');
		},
		formatter: (_msg) => {
			const timestamp = _msg.timestamp();
			const { level, message, meta } = _msg;

			socketServer.exchange.publish(`log:${level}`, {
				timestamp,
				level,
				message: chalk.stripColor(message),
				meta,
			});

			const msg = {
				timestamp,
				message,
				level: colorFunctions[level](level[0]),
			};
			return `${msg.timestamp} ${msg.level}: ${msg.message}`;
		},
		colorize: true
	});
	return winston;
};
