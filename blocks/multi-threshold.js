'use strict';

var sf = require('sf');
var chalk = require('chalk');


/*
detects, if a threshold is crossed upwards or downwards.
arbitrary intervals can be specified:
	threshold = `offset` + n * `step`
for instance "every 7.5 units, relative to 0.33"
*/

function fn(input, step, context, done) {
	var data = step.data;
	var options = step.options;

	var floor_prev = Math.floor((data.prev_value - options.offset) / options.step);
	var floor_current = Math.floor((input - options.offset) / options.step);

	var crossed_up = (floor_prev < floor_current);
	var crossed_down = (floor_current < floor_prev);

	var check = crossed_down || crossed_up;

	var threshold = (crossed_down)
		? floor_prev * options.step + options.offset
		: floor_current * options.step + options.offset;
	if (check) {
		var arrow = (crossed_up) ? '▲' : '▼';
		context.debug( sf('crossed the {0} mark: {1} {3} {2}', chalk.inverse(''+threshold), ''+data.prev_value, ''+input, chalk.inverse(arrow)) );
	}

	var output = {
		up: crossed_up,
		down: crossed_down,
		threshold: threshold,
		value: input
	};

	data.prev_value = input;
	context.saveTask();

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
