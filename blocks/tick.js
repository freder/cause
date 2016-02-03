'use strict';

var _ = require('lodash');


function fn(input, step, context, done) {
	var data = step.data;

	// validation
	if (!_.isNumber(data.counter)) {
		throw new Error('counter must be a number: ' + data.counter);
	}

	context.debug(data.counter);
	var output = data.counter;

	data.counter++;
	context.save();

	done(null, output, null);
}


module.exports = {
	fn: fn,
	defaults: {
		options: {},
		data: {
			counter: 0
		},
		description: 'tick counter'
	}
};
