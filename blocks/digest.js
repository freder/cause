var path = require('path');
var winston = require('winston');
var _ = require('lodash');
var R = require('ramda');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var db = require( path.join(global.paths.root, 'db.js') );


function create(task, step) {
	var defaults = {
		max: 5
	};
	step.options = tasklib.validate_step_options(step, defaults);
	var data_defaults = {
		collected: []
	};
	step.data = tasklib.validate_step_data(step, data_defaults);

	return function(input, prev_step) {
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

		db.save();
	};
}


module.exports = {
	create: create
};
