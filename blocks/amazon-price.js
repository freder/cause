var path = require('path');
var validator = require('validator');
var winston = require('winston');
var chalk = require('chalk');
var sf = require('sf');
var noodle = require('../noodlejs');
noodle.configure({ debug: false });

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );

var debug = require('debug')(path.basename(__filename));


function fn(task, step, input, prev_step) {
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
		var text;
		try {
			text = results.results[0].results[0].text;
		} catch (e) {
			debug('no results', task.name);
			return;
		}
		var price = helper.format_price(text, step.options);
		price = parseFloat(price);
		var output = price;
		var price_changed = (step.data.prev_price != price);
		
		// custom logging
		if (price_changed) {
			try {
				var message_vars = helper.message_vars(task, input, step, prev_step);
				var delta = helper.format_delta(price - step.data.prev_price);
				var message = chalk.green(message_vars.format.money(price));
				winston.info( sf('{0} {1} | {2}', chalk.bgBlue(task.name), delta, message) );
			} catch (e) {
				console.log(e.stack);
			}
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
