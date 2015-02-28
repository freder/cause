var path = require('path');
var validator = require('validator');
var winston = require('winston');
var _ = require('lodash');
var noodle = require('../noodlejs');
noodle.configure({ debug: false });

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var db = require( path.join(global.paths.root, 'db.js') );


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
	step.options = tasklib.validate_step_options(step, defaults);
	var data_defaults = {
		prev_price: 0
	};
	step.data = tasklib.validate_step_data(step, data_defaults);

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

			var price_changed = (step.data.prev_price != price);
			var flow_decision = tasklib.flow_decision(price_changed);

			// invoke children
			tasklib.invoke_children(step, task, output, flow_decision);
			
			step.data.prev_price = price;
			db.save();
		});
	};
}


module.exports = {
	create: create
};
