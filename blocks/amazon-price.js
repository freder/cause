var validator = require('validator');
var sf = require('sf');
var _ = require('lodash');
var request = require('request');


function fn(task, step, input, prev_step, done) {
	var that = this;

	// validation
	if (!validator.isURL(step.options.url)) {
		throw new Error('not a valid url: ' + step.options.url);
	}

	var req_opts = _.defaults(
		{ url: step.options.url },
		that.scraping.request_defaults()
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
		if (err) { return that.handle_error(err); }

		var $selection = that.scraping.query('css', '#priceblock_ourprice', body);

		if (!$selection) {
			that.winston.error( that.utils.format.cli_msg(task.name, 'scraping failed') );
			return;
		}
		
		if ($selection.length === 0) {
			that.winston.error( that.utils.format.cli_msg(task.name, 'selection is empty') );
			return;
		}

		if ($selection.length > 1) {
			that.winston.warn( that.utils.format.cli_msg(task.name, 'more than one element selected — only using first one') );
		}

		var text = $selection.first().text();
		var price = that.utils.format.price(text, step.options);
		price = parseFloat(price);
		var output = price;
		var price_changed = (step.data.prev_price != price);
		
		// custom logging
		if (price_changed) {
			that.utils.log_price_delta(price, step.data.prev_price, task);
		}

		step.data.prev_price = price;
		that.save();

		done(null, output, price_changed);
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
