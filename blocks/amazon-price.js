'use strict';

var validator = require('validator');
var _ = require('lodash');
var request = require('request');


function fn(task, step, input, prev_step, done) {
	var cause = this;

	// validation
	if (!validator.isURL(step.options.url)) {
		throw new Error('not a valid url: ' + step.options.url);
	}

	var req_opts = _.defaults(
		{ url: step.options.url },
		cause.utils.scraping.request_defaults()
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
		if (err) { return done(err); }

		var $selection = cause.utils.scraping.query('css', '#priceblock_ourprice', body);

		var msg;
		if (!$selection) {
			msg = 'scraping failed';
			cause.winston.error( cause.utils.format.cli_msg(task.name, msg) );
			return done(new Error(msg));
		}

		if ($selection.length === 0) {
			msg = 'selection is empty';
			cause.winston.error( cause.utils.format.cli_msg(task.name, msg) );
			return done(new Error(msg));
		}

		if ($selection.length > 1) {
			msg = 'more than one element selected — only using first one';
			cause.winston.warn( cause.utils.format.cli_msg(task.name, msg) );
		}

		var text = $selection.first().text();
		var price = cause.utils.format.price(text, step.options);
		price = parseFloat(price);
		var output = price;
		var price_changed = (step.data.prev_price != price);

		// custom logging
		if (price_changed) {
			cause.winston.info( cause.utils.format.price_delta(price, step.data.prev_price, task) );
		}

		step.data.prev_price = price;
		cause.save();

		done(null, output, price_changed);
	}).on('error', function(err) {
		cause.handle_error(err);
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
