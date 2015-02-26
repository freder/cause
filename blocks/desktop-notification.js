var notifier = require('node-notifier');
var winston = require('winston');
var path = require('path');
var _ = require('lodash');
var fmt = require('simple-fmt');

var helper = require( path.join(global.paths.lib, 'helper.js') );


function create(task, step) {
	return function(input, previous_step) {
		// sanity check
		var config = step.config || {};
		config = _.defaults(config, { // TODO: rename back to `options`
			// https://pushover.net/api
			title: fmt('causality: {0}', task.name),
			message: fmt('{0}: {}', previous_step.module)
		});

		// do the work
		var title = helper.format(config.title, input);
		var message = helper.format(config.message, input);
		notifier.notify({
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
