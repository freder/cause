var path = require('path');
var _ = require('lodash');
var versus = require('versus');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );


function fn(task, step, input, prev_step, done) {
	var output = input;

	// has the threshold been crossed?
	var check = versus(input, step.options.comparison, step.options.value);
	var decision = tasklib.flow_decision(check);

	// trigger only once, when the threshold is reached,
	// otherwise it would keep on triggering.
	// TODO: maybe make desired behavior configurable
	if (check && step.data.triggered) {
		decision['if'] = false;
		decision['else'] = false;
	}
	done(null, output, decision);

	// mark as triggered, or not
	step.data.triggered = check;
	tasklib.save_task(task);
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			// value: 0,
			// comparison: '=='
		},
		data: {
			triggered: false
		},
		description: '<%=options.comparison%> <%=options.value%>'
	},
};
