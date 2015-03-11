var path = require('path');
var crypto = require('crypto');
var winston = require('winston');
var request = require('request');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var scraping = require( path.join(global.paths.lib, 'scraping.js') );

var debug = require('debug')(path.basename(__filename));


function fn(task, step, input, prev_step) {
	var req_options = {
		url: step.options.url,
		// followRedirect: true,
		// maxRedirects: 1
	};
	request(req_options, function(err, res, body) {
		if (err) { return helper.handle_error(err); }

		if (res.statusCode != 200) {
			debug('status code: '+res.statusCode, task.name);
			debug(req_options.url);
			return;
		}

		var $selection = scraping.query(step.options.method, step.options.selector, body);
		if ($selection.length === 0) {
			throw 'selection is empty';
		} else if ($selection.length > 1) {
			winston.warn('selection contains more than one element — only using first one.');
		} // TODO: should it also work with multiple elements?
		var html = $selection.first().html();

		var hash = crypto
			.createHash('md5')
			.update(html)
			.digest('hex');

		var output = input;

		var changed = (hash !== step.data.prev_hash);
		var flow_decision = tasklib.flow_decision(changed);
		tasklib.invoke_children(step, task, output, flow_decision);
		
		step.data.prev_hash = hash;
		tasklib.save_task(task);
	});
};


module.exports = {
	fn: fn,
	defaults: {
		options: {
			selector: 'body',
			method: 'css'
		},
		data: {
			prev_hash: ''
		}
	}
};
