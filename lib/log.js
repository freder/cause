'use strict';

var winston = require('winston');
var moment = require('moment');
var chalk = require('chalk');
var sf = require('sf');

var colors_fns = {
	'info': chalk['green'],
	'warn': chalk['yellow'],
	'error': chalk['red'],
	'debug': chalk['gray']
};

function init() {
	winston.remove(winston.transports.Console);
	winston.add(winston.transports.Console, {
		timestamp: function() {
			// return moment().format('DD-MM-YYYY, HH:mm:ss');
			// return moment().format('DD-MM HH:mm');
			return moment().format('DD-MM HH:mm:ss');
		},
		formatter: function(msg) {
			var d = {
				timestamp: chalk.gray(msg.timestamp()),
				level: colors_fns[msg.level](msg.level[0]),
				message: msg.message
			};
			return sf('{timestamp} {level}: {message}', d);
		},
		colorize: true
	});
}


module.exports = {
	init: init
};
