var path = require('path');
var validator = require('validator');
var winston = require('winston');
var chalk = require('chalk');
var sf = require('sf');
var _ = require('lodash');
var request = require('request');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var cli = require( path.join(global.paths.lib, 'cli.js') );
var scraping = require( path.join(global.paths.lib, 'scraping.js') );

var debug = require('debug')('cause:block:'+path.basename(__filename));


function fn(task, step, input, prev_step) {
	// validation
	if (!validator.isURL(step.options.url)) {
		throw new Error('not a valid url: ' + step.options.url);
	}

	var req_opts = _.defaults(
		{ url: step.options.url },
		scraping.request_defaults()
	);
	req_opts.headers = _.merge(req_opts.headers, {
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
		'Accept-Language': 'en-US,en;q=0.8,de;q=0.6',
		'Cache-Control': 'no-cache',
		'Connection': 'keep-alive',
		'DNT': '1',
		'Pragma': 'no-cache',
		'Referer': 'http://www.amazon.com'
	});

	request(req_opts, function(err, res, body) {
		if (err) { return helper.handle_error(err); }

		var $selection = scraping.query('css', '#priceblock_ourprice', body);

		if (!$selection) {
			winston.error( helper.format_msg(task.name, 'scraping failed') );
			return;
		}
		
		if ($selection.length === 0) {
			winston.error( helper.format_msg(task.name, 'selection is empty') );
			return;
		}

		if ($selection.length > 1) {
			winston.warn( helper.format_msg(task.name, 'more than one element selected — only using first one') );
		}

		var text = $selection.first().text();
		var price = helper.format_price(text, step.options);
		price = parseFloat(price);
		var output = price;
		var price_changed = (step.data.prev_price != price);
		
		// custom logging
		if (price_changed) {
			cli.log_price_delta(price, step.data.prev_price, task);
		}

		var flow_decision = tasklib.flow_decision(price_changed);
		tasklib.invoke_children(step, task, output, flow_decision);
		
		step.data.prev_price = price;
		tasklib.save_task(task);
	});
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			currency: 'EUR'
		},
		data: {
			prev_price: 0
		},
		description: "amazon product\nprice changed"
	}
};
