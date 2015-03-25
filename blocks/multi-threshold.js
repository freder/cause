var path = require('path');
var _ = require('lodash');
var sf = require('sf');
var chalk = require('chalk');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );

var debug = require('debug')('cause:block:'+path.basename(__filename));


/*
detects, if a threshold is crossed upwards or downwards.
arbitrary intervals can be specified:
	threshold = `offset` + n * `step`
for instance "every 7.5 units, relative to 0.33"
*/

function fn(task, step, input, prev_step, done) {
	var floor_prev = Math.floor((step.data.prev_value - step.options.offset) / step.options.step);
	var floor_current = Math.floor((input - step.options.offset) / step.options.step);

	var crossed_up = (floor_prev < floor_current);
	var crossed_down = (floor_current < floor_prev);

	var check = crossed_down || crossed_up;

	if (check) {
		var threshold = (crossed_down)
			? floor_prev * step.options.step + step.options.offset
			: floor_current * step.options.step + step.options.offset;
		var arrow = (crossed_up) ? '▲' : '▼';
		debug( sf('crossed the {0} mark: {1} {3} {2}', chalk.inverse(''+threshold), ''+step.data.prev_value, ''+input, chalk.inverse(arrow)) );
	}

	var output = {
		up: crossed_up,
		down: crossed_down,
	};

	if (done) done(null, output);

	var flow_decision = tasklib.flow_decision(check);
	tasklib.invoke_children(step, task, output, flow_decision);

	step.data.prev_value = input;
	tasklib.save_task(task);
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
