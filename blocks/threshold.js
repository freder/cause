'use strict';

var taskUtils = require('cause-utils/task');
var versus = require('versus');


function fn(input, step, context, done) {
	var output = input;

	// has the threshold been crossed?
	var checkResult = versus(input, step.options.comparison, step.options.value);
	var decision = taskUtils.flowDecision(checkResult);

	// trigger only once, when the threshold is reached,
	// otherwise it would keep on triggering.
	// TODO: maybe make desired behavior configurable
	if (checkResult && step.data.triggered) {
		decision['if'] = false;
		decision['else'] = false;
	}

	// mark as triggered, or not
	step.data.triggered = checkResult;
	context.save();

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
