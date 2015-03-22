var _ = require('lodash');
var winston = require('winston');
var chalk = require('chalk');
var numeral = require('numeral');
var sf = require('sf');
var path = require('path');

var realestate = require( path.join(global.paths.lib, 'realestate.js') );

var debug = require('debug')(path.basename(__filename));


function handle_error(err) {
	// throw err;
	winston.error(err.stack);
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


module.exports = {
	handle_error: handle_error,
	get_by: get_by,
	get_all_by_name: get_all_by_name,
	get_by_name: get_by_name,
	format_delta: format_delta,
	format_price: format_price,
	parse_time: parse_time,
	make_googlemaps_url: make_googlemaps_url,
	message_vars: message_vars,
};
