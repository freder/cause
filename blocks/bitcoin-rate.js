var path = require('path');
var winston = require('winston');
var _ = require('lodash');
var request = require('request');

var helper = require( path.join(global.paths.lib, 'helper.js') );


function create(task, step) {
	var defaults = {
		market: 'bitcoin_de'
	};
	helper.validate_step_options(step, defaults);
	var data_defaults = {
		prev_price: null
	};
	helper.validate_step_data(step, data_defaults);

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

			var flow_decision = helper.flow_decision_defaults;
			helper.invoke_children(step, task, output, flow_decision);
		});
	};
}


module.exports = {
	create: create
};
