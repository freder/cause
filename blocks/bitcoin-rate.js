var path = require('path');
var chalk = require('chalk');
var winston = require('winston');
var sf = require('sf');
var _ = require('lodash');
var request = require('request');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var cli = require( path.join(global.paths.lib, 'cli.js') );
var scraping = require( path.join(global.paths.lib, 'scraping.js') );

var debug = require('debug')('cause:block:'+path.basename(__filename));


function fn(task, step, input, prev_step) {
	// expects no input

	var req_opts = _.defaults(
		{
			url: 'https://api.bitcoinaverage.com/exchanges/EUR',
			json: true
		},
		scraping.request_defaults()
	);
	request(req_opts, function(err, res, body) {
		if (err) { return helper.handle_error(err); }

		if (res.statusCode != 200) {
			debug('status code: '+res.statusCode, task.name);
			debug(req_opts.url);
			return;
		}

		var market = body[step.options.market];
		var price = market.rates.last;
		var output = price;
		
		cli.log_price_delta(price, step.data.prev_price, task);

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
		},
		description: "฿ rate on\n<%=options.market%>"
	},
};
