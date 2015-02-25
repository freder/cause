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


function get_by(obj_array, key, value) {
	return obj_array.filter(function(o) {
		return (o[key] == value);
	});
}

function get_all_by_name(array, name) {
	return get_by(array, 'name', name);
}

function get_by_name(array, name) {
	return get_all_by_name(array, name)[0];
}


function notify(obj) {
	notifier.notify(obj);
}


module.exports = {
	handle_error: handle_error,
	module_log_format: module_log_format,
	notify: notify,
	get_by: get_by,
	get_all_by_name: get_all_by_name,
	get_by_name: get_by_name
};
