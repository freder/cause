var request = require('request');
var cheerio = require('cheerio');
var validator = require('validator');
var winston = require('winston');

var helper = require('./helper.js');
var email = require('./email.js');


var price_selector = '#priceblock_ourprice';


function format_price(price) {
	return price
		.replace(/EUR/, '')
		.replace(' ', '')
		.replace(',', '.');
}


function create_pricecheck(options, callback) {
	// TODO: validate url
	if (!validator.isURL(options.url)) {
		// TODO: what to do in such a case?
		winston.error('not a valid URL: ' + options.url);
	}

	var previous_value = null;

	return function check_price() {
		request(options.url, function(err, response, html) {
			if (err) {
				helper.handle_error(err);
				return;
			}

			var $ = cheerio.load(html);
			var price = $(price_selector).text();
			price = format_price(price);
			price = parseFloat(price);

			if (previous_value != price) {
				winston.info('price has changed: ' + price);				
			}

			if (options.threshold && price <= options.threshold) {
				var subject = 'price alert: ' + price;
				var link = '<a href="'+options.url+'">'+options.url+'</a>';
				email.send(subject, link);
			}

		});
	}
}


module.exports = {
	create_pricecheck: create_pricecheck
};
