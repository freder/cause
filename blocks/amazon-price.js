var path = require('path');
var validator = require('validator');
var winston = require('winston');
var chalk = require('chalk');
var sf = require('sf');
var request = require('request');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var scraping = require( path.join(global.paths.lib, 'scraping.js') );

var debug = require('debug')(path.basename(__filename));


function fn(task, step, input, prev_step) {
	// validation
	if (!validator.isURL(step.options.url)) {
		var msg = 'not a valid url: ' + step.options.url;
		throw msg;
	}

	var req_options = {
		url: step.options.url
	};
	request(req_options, function(err, res, body) {
		if (err) { return helper.handle_error(err); }

		var $selection = scraping.query('css', '#priceblock_ourprice', body);
		
		// TODO: DRY
		if ($selection.length > 1) {
			winston.warn('selection contains more than one element — only using first one.');
		} // TODO: should it also work with multiple elements?

		var text = $selection.first().text();
		var price = helper.format_price(text, step.options);
		price = parseFloat(price);
		var output = price;
		var price_changed = (step.data.prev_price != price);
		
		// custom logging
		if (price_changed) {
			helper.log_price_delta(price, step.data.prev_price, task);
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
		}
	}
};
