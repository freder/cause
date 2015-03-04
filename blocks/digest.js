var path = require('path');
var _ = require('lodash');
var R = require('ramda');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );


function fn(task, step, input, prev_step) {
	if (_.isArray(input)) {
		step.data.collected = step.data.collected.concat(input);
	} else {
		step.data.collected.push(input);
	}

	while (step.data.collected.length >= step.options.max) {
		var flow_decision = tasklib.flow_decision(true);
		var output = R.take(step.options.max, step.data.collected);
		tasklib.invoke_children(step, task, output, flow_decision);
		step.data.collected = R.drop(step.options.max, step.data.collected);
	}

	tasklib.save_task(task);
}


module.exports = {
	fn: fn,
	defaults: {
		max: 5
	},
	data_defaults: {
		collected: []
	}
};
