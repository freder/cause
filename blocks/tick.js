var path = require('path');

var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );


var fn = (function() {
	var counter = 0;

	return function(task, step,input, prev_step) {
		var flow_decision = tasklib.flow_decision_defaults;
		var output = counter;
		console.log(output);
		tasklib.invoke_children(step, task, output, flow_decision);
		counter++;
	};
})();


module.exports = {
	fn: fn,
	defaults: {
		options: {},
		data: {}
	}
};
