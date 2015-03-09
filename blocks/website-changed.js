var path = require('path');
var crypto = require('crypto');
var cheerio = require('cheerio');
var winston = require('winston');
var request = require('request');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );


function query(method, selector, html) {
	method = method || 'css';
	var $ = cheerio.load(html);
	var result;
	switch (method) {
		case 'css':
			result = $(selector);
			break;
		case 'jquery':
			result = eval(selector);
			break;
	}
	return result;
}


function fn(task, step, input, prev_step) {
	var req_options = {
		url: step.options.url
	};
	request(req_options, function(err, response, body) {
		if (err) {
			return helper.handle_error(err);
		}

		var selection = query(step.options.method, step.options.selector, body);
		if (selection.length === 0) {
			throw 'selection is empty';
		} else if (selection.length > 1) {
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
	},
	query: query
};
