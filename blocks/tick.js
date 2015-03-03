var path = require('path');

var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );


function create(task, step) {
	var defaults = {};
	step.options = tasklib.normalize_step_options(step, defaults);
	var data_defaults = {};
	step.data = tasklib.normalize_step_data(step, data_defaults);

	var counter = 0;

	return function(input, prev_step) {
		var flow_decision = tasklib.flow_decision_defaults;
		var output = counter;
		console.log(output);
		tasklib.invoke_children(step, task, output, flow_decision);
		counter++;
	};
}


module.exports = {
	create: create
};
