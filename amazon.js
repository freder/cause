var cheerio = require('cheerio');
var validator = require('validator');
var winston = require('winston');
// var request = require('request');
var noodle = require('./noodlejs');
noodle.configure({
	debug: false,
	/*"resultsCacheMaxTime":   0,
	// "resultsCachePurgeTime": 60480000, // -1 will turn purging off
	"resultsCacheMaxSize":   0,
	"pageCacheMaxTime":      0,
	// "pageCachePurgeTime":    60480000, // -1 will turn purging off
	"pageCacheMaxSize":      0,	*/		
});
// noodle.stopCache();

var helper = require('./helper.js');
var email = require('./email.js');


var price_selector = '#priceblock_ourprice';


function format_price(price) {
	return price
		.replace(/EUR/, '')
		.replace(' ', '')
		.replace(',', '.');
}


function create_pricecheck(options/*, callback*/) {
	// TODO: validate url
	if (!validator.isURL(options.url)) {
		// TODO: what to do in such a case?
		winston.error('not a valid URL: ' + options.url);
	}

	var previous_value = null;
	function process_price(price_text) {
		var price = format_price(price_text);
		price = parseFloat(price);

		if (previous_value != price) {
			winston.info('price has changed: ' + price);
		}

		if (options.threshold && price <= options.threshold) {
			var subject = 'price alert: ' + price;
			var link = '<a href="'+options.url+'">'+options.url+'</a>';
			email.send(subject, link);
		}

		previous_value = price;
	}

	return function check_price() {
		// request(options.url, function(err, response, html) {
		// 	if (err) {
		// 		helper.handle_error(err);
		// 		return;
		// 	}

		// 	var $ = cheerio.load(html);
		// 	var text = $(price_selector).text();
		// 	process_price(text);
		// });
		
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


module.exports = {
	create_pricecheck: create_pricecheck
};
