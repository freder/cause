var path = require('path');
var chalk = require('chalk');
var cheerio = require('cheerio');
var validator = require('validator');
var versus = require('versus');
var winston = require('winston');
var _ = require('lodash');
var noodle = require('../noodlejs');
noodle.configure({ debug: false });

var helper = require( path.join(global.paths.lib, 'helper.js') );


function format_price(price, config) {
	var price = price
		.replace(config.currency, '')
		.replace(' ', '');
	switch (config.currency.toLowerCase()) {
		case 'eur':
			price = price.replace('.', '');
			price = price.replace(',', '.');
			break;
		default:
			price = price.replace(',', '');
			break;
	}
	return price;
}


function create(task, step) {
	step.data = step.data || {};
	var previous_price = step.data.previous_price || null;

	return function(input, previous_step) {
		// sanity check
		var config = step.config || {};
		config = _.defaults(config, {
			currency: 'EUR'
		});
		
		// validation
		if (!validator.isURL(step.config.url)) {
			winston.error('not a valid url: ' + step.config.url);
		}

		// do the work
		noodle.query({
			cache: false,
			url: config.url,
			selector: '#priceblock_ourprice',
			extract: ['text']
		})
		.fail(helper.handle_error)
		.then(function(results) {
			var text = results.results[0].results[0].text;
			var price = format_price(text, config);
			price = parseFloat(price);

			if (previous_price !== price) {
				// price has changed

				// TODO: only invoke following steps when the price changed?
				// TODO: should logging, db save, email, notificaitons really be blocks, too?

				// invoke children
				var children = helper.get_children(step, task);
				children.forEach(function(child) {
					child.execute(price, step);
				});
			}

			previous_price = price;
			// TODO: save to db
		});
	};
}


module.exports = {
	create: create
};
