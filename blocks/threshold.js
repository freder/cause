'use strict';

const versus = require('versus');


function fn(input, step, context, done) {
	const output = input;

	// has the threshold been crossed?
	const checkResult = versus(
		input,
		step.options.comparison,
		step.options.value
	);
	let decision = context.prepareDecision(checkResult);

	// trigger only once, when the threshold is reached,
	// otherwise it would keep on triggering.
	// TODO: make desired behavior configurable
	if (checkResult && step.data.triggered) {
		decision['if'] = false;
		decision['else'] = false;
	}

	// mark as triggered, or not
	step.data.triggered = checkResult;
	context.saveTask();

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
