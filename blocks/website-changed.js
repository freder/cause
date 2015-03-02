var path = require('path');
var crypto = require('crypto');
var cheerio = require('cheerio');
var winston = require('winston');
var request = require('request');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var db = require( path.join(global.paths.root, 'db.js') );


function create(task, step) {
	var defaults = {
		selector: 'body'
	};
	step.options = tasklib.validate_step_options(step, defaults);

	var data_defaults = {
		prev_hash: ''
	};
	step.data = tasklib.validate_step_data(step, data_defaults);

	return function(input, prev_step) {
		var req_options = {
			url: step.options.url
		};
		request(req_options, function(err, response, body) {
			if (err) {
				return helper.handle_error(err);
			}

			var $ = cheerio.load(body);
			var selection = $(step.options.selector);
			if (selection.length === 0) {
				throw 'selection is empty';
			} else if (selection.length) {
				winston.warn('selection contains more than one element — only using first one.');
			}
			var html = selection.first().html();

			var hash = crypto
				.createHash('md5')
				.update(html)
				.digest('hex');

			var output = input;

			var changed = (hash !== step.data.prev_hash);
			var flow_decision = tasklib.flow_decision(changed);
			tasklib.invoke_children(step, task, output, flow_decision);
			
			step.data.prev_hash = hash;
			db.save();
		});
	};
}


module.exports = {
	create: create
};
