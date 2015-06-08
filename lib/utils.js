var _ = require('lodash');
var chalk = require('chalk');
var winston = require('winston');
var numeral = require('numeral');
var sf = require('sf');
var path = require('path');

var realestate = require('./realestate.js');
var debug = require('debug')('cause:lib:'+path.basename(__filename));


function handle_error(err) {
	// throw err;
	winston.error(err.stack);
}


function get_by(obj_array, key, value) {
	return obj_array.filter(function(o) {
		return (o[key] == value);
	});
}


function get_first_by(obj_array, key, value) {
	return get_by(obj_array, key, value)[0];
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


function format_price_delta(price, prev_price, task) {
	var msg_vars = message_vars(task/*, input, step, prev_step*/);
	var delta = format.delta(price - prev_price);
	var message = chalk.green(msg_vars.format.money(price));
	return sf('{0} | {1}', format.cli_msg(task.name, delta), message);
}
function log_price_delta(price, prev_price, task) {
	var msg = format_price_delta(price, prev_price, task);
	winston.info(msg);
}



function format_cli_msg(prefix, msg) {
	msg = msg || '';
	return sf('{0} {1}', chalk.bgBlue(prefix), msg);
}


function parse_time(s) {
	// "12 minutes"

	var parsed = {};
	var tokens = s.split(' ');

	if (tokens.length > 2) {
		debug("can't recognize format: " + s);
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
			money: function(x) { return numeral(x).format('0.00'); },
			house: function(i) { return realestate.format_item(i); }
		}
	};
}


var format = {
	cli_msg: format_cli_msg,
	delta: format_delta,
	price: format_price,
	price_delta: format_price_delta,
};
var parse = {
	time: parse_time,
};

module.exports = {
	format: format,
	parse: parse,

	handle_error: handle_error,
	get_first_by: get_first_by,
	make_googlemaps_url: make_googlemaps_url,
	log_price_delta: log_price_delta,
	message_vars: message_vars
};
