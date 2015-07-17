'use strict';

var versus = require('versus');


function fn(task, step, input, prev_step, done) {
	var cause = this;
	var output = input;

	// has the threshold been crossed?
	var check = versus(input, step.options.comparison, step.options.value);
	var decision = cause.tasklib.flow_decision(check);

	// trigger only once, when the threshold is reached,
	// otherwise it would keep on triggering.
	// TODO: maybe make desired behavior configurable
	if (check && step.data.triggered) {
		decision['if'] = false;
		decision['else'] = false;
	}

	// mark as triggered, or not
	step.data.triggered = check;
	cause.save();

	done(null, output, decision);
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
