var path = require('path');
var chalk = require('chalk');
var sf = require('sf');
var winston = require('winston');
var _ = require('lodash');
var request = require('request');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var db = require( path.join(global.paths.root, 'db.js') );


function create(task, step) {
	var defaults = {
		market: 'bitcoin_de'
	};
	step.options = tasklib.validate_step_options(step, defaults);
	var data_defaults = {
		prev_price: 0
	};
	step.data = tasklib.validate_step_data(step, data_defaults);

	return function(input, prev_step) {
		var req_options = {
			url: 'https://api.bitcoinaverage.com/exchanges/EUR',
			json: true
		};
		request(req_options, function(err, response, body) {
			if (err) {
				helper.handle_error(err);
				return;
			}

			var market = body[step.options.market];
			var price = market.rates.last;
			var output = price;

			var delta = price - step.data.prev_price;
			// var arrow = chalk.white('▶');
			var arrow = chalk.white('');
			var sign = '±';
			if (delta > 0) {
				arrow = chalk.green('▲');
				sign = '+';
			}
			if (delta < 0) {
				arrow = chalk.red('▼');
				sign = '';
			}
			winston.warn( sf('{0}{1:0.00} {2}', sign, delta, arrow) ); // TODO: modules should be able to do their own logging

			var flow_decision = tasklib.flow_decision_defaults;
			tasklib.invoke_children(step, task, output, flow_decision);

			step.data.prev_price = price;
			db.save();
		});
	};
}


module.exports = {
	create: create
};
