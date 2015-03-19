// this block checks if a (part of a) website has
// changed, since the last time we chacked.

var path = require('path');
var crypto = require('crypto');
var winston = require('winston');
var request = require('request');
var validator = require('validator');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var scraping = require( path.join(global.paths.lib, 'scraping.js') );

var debug = require('debug')(path.basename(__filename));


// every block exposes a function that takes
// following parameters:
function fn(
		task,		// the task this step is part of
		step,		// the current step
		input,		// the previous step's output is this step's input
		prev_step	// the previous step
		) {

	// when a step is created,
	// `step.options` and `step.data` are populated with
	// values from the task config file, or with the defaults
	// that the step defines itself. — see end of file.

	// validation
	if (!validator.isURL(step.options.url)) {
		throw 'not a valid url: ' + step.options.url;
	}

	var req_options = {
		url: step.options.url
	};
	request(req_options, function(err, res, body) {
		if (err) { return helper.handle_error(err); }

		if (res.statusCode != 200) {
			debug('status code: '+res.statusCode, task.name);
			debug(req_options.url);
			return;
		}

		// select part of page
		var $selection = scraping.query(step.options.method, step.options.selector, body);
		if ($selection.length > 1) {
			winston.warn('selection contains more than one element — only using first one.');
		}
		var html = $selection.first().html();

		// create a hash for it
		var hash = crypto
			.createHash('md5')
			.update(html)
			.digest('hex');


		// check if anything has changed
		var changed = (hash !== step.data.prev_hash);
		// based on this, it is decided on which of the
		// block's three outlets (`if`, `else`, `anyway`)
		// the flow continues.
		var flow_decision = tasklib.flow_decision(changed);

		// this block simply passes through its input
		var output = input;

		// invoke child steps
		tasklib.invoke_children(step, task, output, flow_decision);
		
		// save current hash to file
		step.data.prev_hash = hash;
		tasklib.save_task(task);
	});
};


module.exports = {
	fn: fn,

	defaults: {
		// defaults to as fallbacks, in case they are 
		// not specified in the config file
		options: {
			selector: 'body',
			method: 'css'
		},

		// data to be persisted between executions
		data: {
			prev_hash: ''
		}
	}
};
