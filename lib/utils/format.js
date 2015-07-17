'use strict';

var chalk = require('chalk');
var numeral = require('numeral');
var sf = require('sf');


function message_vars(task, input, step, prev_step) {
	// wrap everything in an object, so that it can
	// easily be referenced from within string templates.
	return {
		task: task,
		input: input,
		step: step,
		prev_step: prev_step,
		// additional formatting functions:
		format: {
			list: function(l) { return l.join('\n'); },
			money: money
		}
	};
}


function money(x) {
	return numeral(x).format('0.00');
}


function price(price, options) {
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


function delta(d) {
	var arrow = chalk.gray('=');
	var sign = ' ';
	if (d > 0) {
		arrow = chalk.green('▲');
		sign = '+';
	}
	if (d < 0) {
		arrow = chalk.red('▼');
		sign = '';
	}
	return sf('{0}{1:0.00} {2}', sign, d, arrow);
}


function price_delta(price, prev_price, task) {
	var d = delta(price - prev_price);
	var message = chalk.green(money(price));
	return sf('{0} | {1}', cli_msg(task.name, d), message);
}


function cli_msg(prefix, msg) {
	msg = msg || '';
	return sf('{0} {1}', chalk.bgBlue(prefix), msg);
}


module.exports = {
	cli_msg: cli_msg,
	delta: delta,
	price: price,
	price_delta: price_delta,
	money: money,
	message_vars: message_vars,
};
