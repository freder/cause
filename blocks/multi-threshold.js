'use strict';

var sf = require('sf');
var chalk = require('chalk');


/*
detects, if a threshold is crossed upwards or downwards.
arbitrary intervals can be specified:
	threshold = `offset` + n * `step`
for instance "every 7.5 units, relative to 0.33"
*/

function fn(task, step, input, prev_step, done) {
	var cause = this;

	var floor_prev = Math.floor((step.data.prev_value - step.options.offset) / step.options.step);
	var floor_current = Math.floor((input - step.options.offset) / step.options.step);

	var crossed_up = (floor_prev < floor_current);
	var crossed_down = (floor_current < floor_prev);

	var check = crossed_down || crossed_up;

	var threshold = (crossed_down)
		? floor_prev * step.options.step + step.options.offset
		: floor_current * step.options.step + step.options.offset;
	if (check) {
		var arrow = (crossed_up) ? '▲' : '▼';
		cause.debug( sf('crossed the {0} mark: {1} {3} {2}', chalk.inverse(''+threshold), ''+step.data.prev_value, ''+input, chalk.inverse(arrow)) );
	}

	var output = {
		up: crossed_up,
		down: crossed_down,
		threshold: threshold,
		value: input
	};

	step.data.prev_value = input;
	cause.save();

	done(null, output, check);
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			offset: 0,
			step: 1
		},
		data: {
			prev_value: 0
		},
		// description: '<%=options.comparison%> <%=options.value%>'
	},
};
