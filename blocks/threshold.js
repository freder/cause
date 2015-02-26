var path = require('path');
var _ = require('lodash');
var versus = require('versus');

var helper = require( path.join(global.paths.lib, 'helper.js') );


function create(task, step) {
	var defaults = {
		// value: 0,
		// comparison: '=='
	};
	helper.validate_step_options(step, defaults);
	helper.validate_step_data(step);

	return function(input, prev_step) {
		var check = versus(input, step.options.comparison, step.options.value);
		var flow_decision = helper.flow_decision(check);

		// pass through
		var output = input;

		// invoke children
		helper.invoke_children(step, task, output, flow_decision);
	};
}


module.exports = {
	create: create
};
