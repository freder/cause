'use strict';

var _ = require('lodash');


function fn(task, step, input, prev_step, done) {
	var cause = this;

	// validation
	if (!_.isNumber(step.data.counter)) {
		throw new Error('counter must be a number: ' + step.data.counter);
	}

	cause.debug(step.data.counter);

	var output = step.data.counter;

	step.data.counter++;
	cause.save();

	done(null, output, null);
}


module.exports = {
	fn: fn,
	defaults: {
		options: {},
		data: {
			counter: 0
		},
		description: "tick counter"
	}
};
