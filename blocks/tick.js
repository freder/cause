var path = require('path');
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var debug = require('debug')(path.basename(__filename));


function fn(task, step, input, prev_step) {
	debug(step.data.counter);
	
	var output = step.data.counter;
	var flow_decision = tasklib.flow_decision_defaults;
	tasklib.invoke_children(step, task, output, flow_decision);

	step.data.counter++;
	tasklib.save_task(task);
}


module.exports = {
	fn: fn,
	defaults: {
		options: {},
		data: {
			counter: 0
		}
	}
};
