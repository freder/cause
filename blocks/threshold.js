var path = require('path');
var _ = require('lodash');
var versus = require('versus');

var db = require( path.join(global.paths.root, 'db.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );


function create(task, step) {
	var defaults = {
		// value: 0,
		// comparison: '=='
	};
	step.options = tasklib.normalize_step_options(step, defaults);
	var data_defaults = {
		triggered: false
	};
	step.data = tasklib.normalize_step_data(step, data_defaults);

	return function(input, prev_step) {
		var output = input;

		// has the threshold been crossed?
		var check = versus(input, step.options.comparison, step.options.value);
		var flow_decision = tasklib.flow_decision(check);

		// trigger only once, when the threshold is reached,
		// otherwise it would keep on triggering.
		// TODO: maybe make desired behavior configurable
		if (check && step.data.triggered) {
			flow_decision['if'] = false;
			flow_decision['else'] = false;
		}

		tasklib.invoke_children(step, task, output, flow_decision);

		// mark as triggered, or not
		step.data.triggered = check;
		db.save(); // TODO: save automatically from where this function is called?
	};
}


module.exports = {
	create: create
};
