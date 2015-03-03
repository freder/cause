var path = require('path');
var chalk = require('chalk');
var winston = require('winston');
var sf = require('sf');
var _ = require('lodash');
var request = require('request');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var db = require( path.join(global.paths.root, 'db.js') );


function create(task, step) {
	var defaults = {
		market: 'bitcoin_de'
	};
	step.options = tasklib.normalize_step_options(step, defaults);
	var data_defaults = {
		prev_price: 0
	};
	step.data = tasklib.normalize_step_data(step, data_defaults);

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
			
			// custom logging
			// TODO: check if { config: { log: false } } or so
			var message_vars = helper.message_vars(task, input, step, prev_step);
			var delta = helper.format_delta(price - step.data.prev_price);
			var message = chalk.green(message_vars.format.money(price));
			winston.info( sf('{0} {1} | {2}', chalk.bgBlue(task.name), delta, message) );

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
