var _ = require('lodash');
var winston = require('winston');
var chalk = require('chalk');
var numeral = require('numeral');
var sf = require('sf');
var fs = require('fs');
var path = require('path');


function handle_error(err) {
	// throw err;
	winston.error(err.stack);
}


function load_json(filepath) {
	var data = fs.readFileSync(filepath).toString();
	return JSON.parse(data);
}


function filename_extension(filepath) {
	var filename = path.basename(filepath);
	var last_index = filename.lastIndexOf('.');
	return {
		name: filename.substr(0, last_index),
		ext: filename.substr(last_index + 1)
	}
}
function get_filename(filepath) {
	return filename_extension(filepath).name;
}
// function get_extension(filepath) {
// 	return filename_extension(filepath).ext;
// }


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


function format_price(price, options) {
	// options: { currency: 'EUR' }
	var price = price
		.replace(options.currency, '')
		.replace(' ', '');
	switch (options.currency) {
		case 'EUR':
			price = price.replace('.', '');
			price = price.replace(',', '.');
			break;
		default:
			price = price.replace(',', '');
			break;
	}
	return price;
}


function log_price_delta(price, prev_price, task) {
	var message_vars = message_vars(task/*, input, step, prev_step*/);
	var delta = format_delta(price - prev_price);
	var message = chalk.green(message_vars.format.money(price));
	winston.info( sf('{0} {1} | {2}', chalk.bgBlue(task.name), delta, message) );
}


function format_delta(delta) {
	var arrow = chalk.gray('=');
	var sign = ' ';
	if (delta > 0) {
		arrow = chalk.green('▲');
		sign = '+';
	}
	if (delta < 0) {
		arrow = chalk.red('▼');
		sign = '';
	}
	return sf('{0}{1:0.00} {2}', sign, delta, arrow);
}


function parse_time(s) {
	// "12 minutes"

	var parsed = {};
	var tokens = s.split(' ');

	if (tokens.length > 2) {
		console.warn("can't recognize format.")
	} else {
		parsed[tokens[1]] = parseInt(tokens[0]);
	}
	return parsed;
}


function make_googlemaps_url(address, city, country) {
	address = address || '';
	city = city || 'Den Haag';
	country = country || 'Netherlands';
	var q = [
			address.replace(/ +/g, '+'),
			city.replace(/ +/g, '+'),
			country.replace(/ +/g, '+')
		].join(',+');
	return sf('http://www.google.com/maps/place/{0}/', q);
}


function message_vars(task, input, step, prev_step) {
	return {
		task: task,
		input: input,
		step: step,
		prev_step: prev_step,
		format: {
			list: function(l) { return l.join('\n'); },
			money: function(x) { return numeral(x).format('0.00'); }
		}
	};
}


function list_tasks() {
	console.log('———————————————');
	console.log('TASKS');
	tasks.forEach(function(task, index) {
		console.log( sf('({2}) {0} ({1})', chalk.bgBlue(task.name), task.interval, index) );
	});
	console.log('———————————————');
}


module.exports = {
	handle_error: handle_error,
	load_json: load_json,
	get_filename: get_filename,
	get_by: get_by,
	get_all_by_name: get_all_by_name,
	get_by_name: get_by_name,
	format_delta: format_delta,
	format_price: format_price,
	log_price_delta: log_price_delta,
	parse_time: parse_time,
	make_googlemaps_url: make_googlemaps_url,
	list_tasks: list_tasks,
	message_vars: message_vars,
};
