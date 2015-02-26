var pushover = require('pushover-notifications');
var winston = require('winston');
var path = require('path');
var _ = require('lodash');
var fmt = require('simple-fmt');

var config = require( path.join(global.paths.root, 'config.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );


var p = new pushover({
	user: config.pushover.user_key,
	token: config.pushover.api_key
});


function send(msg) {
	p.send(msg, function(err, result) {
		if (err) throw err;
	});
}


function create(task, step) {
	return function(input, previous_step) {
		// sanity check
		var config = step.config || {};
		config = _.defaults(config, {
			// https://pushover.net/api
			title: fmt('causality: {0}', task.name),
			message: fmt('{0}: {}', previous_step.module)
		});

		// do the work
		var title = helper.format(config.title, input);
		var message = helper.format(config.message, input);
		send({
			title: title,
			message: message
		});

		// pass through
		var output = input;

		// invoke children
		var children = helper.get_children(step, task);
		children.forEach(function(child) {
			child.execute(output, step);
		});
	};
}


module.exports = {
	create: create
};
