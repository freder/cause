var path = require('path');
var validator = require('validator');
var winston = require('winston');
var sf = require('sf');
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
	step.options = tasklib.normalize_step_options(step, defaults);
	var data_defaults = {
		prev_price: 0
	};
	step.data = tasklib.normalize_step_data(step, data_defaults);

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
			
			// custom logging
			if (price_changed) {
				// TODO: DRY
				var message_vars = helper.message_vars(task, input, step, prev_step);
				var delta = helper.format_delta(price - step.data.prev_price);
				var message = chalk.green(message_vars.format.money(price));
				winston.info( sf('{0} {1} | {2}', chalk.bgBlue(task.name), delta, message) );
			}

			var flow_decision = tasklib.flow_decision(price_changed);
			tasklib.invoke_children(step, task, output, flow_decision);
			
			step.data.prev_price = price;
			db.save();
		});
	};
}


module.exports = {
	create: create
};
