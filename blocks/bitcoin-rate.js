var path = require('path');
var chalk = require('chalk');
var winston = require('winston');
var sf = require('sf');
var request = require('request');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );

var debug = require('debug')(path.basename(__filename));


function fn(task, step, input, prev_step) {
	var req_options = {
		url: 'https://api.bitcoinaverage.com/exchanges/EUR',
		json: true
	};
	request(req_options, function(err, res, body) {
		if (err) { return helper.handle_error(err); }

		if (res.statusCode != 200) {
			debug('status code: '+res.statusCode, task.name);
			debug(req_options.url);
			return;
		}

		var market = body[step.options.market];
		var price = market.rates.last;
		var output = price;
		
		// TODO: check if { config: { log: false } } or so
		var message_vars = helper.message_vars(task, input, step, prev_step);
		var delta = helper.format_delta(price - step.data.prev_price);
		var message = chalk.green(message_vars.format.money(price));
		winston.info( sf('{0} {1} | {2}', chalk.bgBlue(task.name), delta, message) );

		var flow_decision = tasklib.flow_decision_defaults;
		tasklib.invoke_children(step, task, output, flow_decision);

		step.data.prev_price = price;
		tasklib.save_task(task);
	});
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			market: 'bitcoin_de'
		},
		data: {
			prev_price: 0
		}
	},
};
