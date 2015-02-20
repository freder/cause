var chalk = require('chalk');
var cheerio = require('cheerio');
var validator = require('validator');
var versus = require('versus');
var winston = require('winston');
var noodle = require('../noodlejs');
noodle.configure({
	debug: false
});

var helper = require('../helper.js');
var email = require('../email.js');


var price_selector = '#priceblock_ourprice';


function format_price(price) {
	return price
		.replace(/EUR/, '')
		.replace(' ', '')
		.replace(',', '.');
}


function create_pricecheck(options) {
	options.threshold = options.threshold || {};

	if (!validator.isURL(options.url)) {
		winston.error('not a valid URL: ' + options.url);
	}

	var previous_value = null;
	function process_price(price_text) {
		var price = format_price(price_text);
		price = parseFloat(price);

		if (previous_value != price) {
			var line = 'price changed: '+chalk.green(price);
			winston.info( helper.module_log_format(line, options) );

			if (global.args.notifications) {
				helper.notify({
					title: [options.module, options.name].join(': '),
					message: chalk.stripColor(line)
				});
			}
		}

		if (options.threshold.value && versus(price, options.threshold.comparison, options.threshold.value)) {

			if (options.threshold.email) {
				var subject = 'price alert: ' + price;
				var link = '<a href="'+options.url+'">'+options.url+'</a>';
				email.send(subject, link);
			}
		}

		previous_value = price;
	}

	return function check_price() {		
		noodle.query({
			cache: false,
			url: options.url,
			selector: price_selector,
			extract: ['text']
		})
		.fail(helper.handle_error)
		.then(function(results) {
			var text = results.results[0].results[0].text;
			process_price(text);
		});
	};
}


module.exports = function(options) {
	return create_pricecheck(options);
};
