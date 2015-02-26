var pushover = require('pushover-notifications');
var winston = require('winston');
var path = require('path');
var _ = require('lodash');
var sf = require('sf');

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
	// https://pushover.net/api
	var defaults = {
		title: 'causality: {task.name}',
		message: '{prev_step.module}: {input}'
	};
	helper.validate_step_options(step, defaults);
	helper.validate_step_data(step);

	return function(input, prev_step) {
		var message_vars = helper.message_vars(task, input, step, prev_step);

		var title = sf(step.options.title, message_vars);
		var message = sf(step.options.message, message_vars);
		send({
			title: title,
			message: message
		});

		// pass through
		var output = input;

		// invoke children
		helper.invoke_children(step, task, output);
	};
}


module.exports = {
	create: create
};
