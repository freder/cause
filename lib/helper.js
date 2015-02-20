var _ = require('lodash');
var winston = require('winston');
var chalk = require('chalk');
var notifier = require('node-notifier');


function handle_error(err) {
	// util.error(chalk.red(err));
	winston.error(err);
}


function module_log_format(message, options) {
	var message = chalk.white(message);
	var module, name;
	if (options) {
		var module = chalk.blue(options.module || '');
		var name = chalk.bgBlue(options.name || '');			
	}
	return _.compact([module, name, message]).join(' ');
}


function notify(obj) {
	notifier.notify(obj);
}


module.exports = {
	handle_error: handle_error,
	module_log_format: module_log_format,
	notify: notify
};
