var path = require('path');
var validator = require('validator');
var winston = require('winston');
// var versus = require('versus');
var _ = require('lodash');
var noodle = require('../noodlejs');
noodle.configure({ debug: false });

var helper = require( path.join(global.paths.lib, 'helper.js') );


function format_price(price, options) {
	var price = price
		.replace(options.currency, '')
		.replace(' ', '');
	switch (options.currency) {
		case 'EUR':
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
	var defaults = {
		currency: 'EUR'
	};
	helper.validate_step_options(step, defaults);
	var data_defaults = {
		prev_price: null
	};
	helper.validate_step_data(step, data_defaults);

	return function(input, prev_step) {
		// validation
		if (!validator.isURL(step.options.url)) {
			var msg = 'not a valid url: ' + step.options.url;
			throw msg;
		}

		// do the work
		noodle.query({
			cache: false,
			url: step.options.url,
			selector: '#priceblock_ourprice',
			extract: ['text']
		})
		.fail(helper.handle_error)
		.then(function(results) {
			var text = results.results[0].results[0].text;
			var price = format_price(text, step.options);
			price = parseFloat(price);
			var output = price;

			if (step.data.prev_price !== price) {
				// price has changed

				// TODO: only invoke following steps when the price changed?
				// TODO: should logging, db save, email, notificaitons really be blocks, too?

				// invoke children
				helper.invoke_children(step, task, output);
			}

			step.data.prev_price = price;
			// TODO: save to db
		});
	};
}


module.exports = {
	create: create
};
