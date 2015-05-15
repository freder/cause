var path = require('path');
var sf = require('sf');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var cli = require( path.join(global.paths.lib, 'cli.js') );

var debug = require('debug')('cause:block:'+path.basename(__filename));


function fn(task, step, input, prev_step, done) {
	var output;
	var decision;

	function cb() {
		output = output || input;
		done(null, output);

		decision = decision || false;
		var flow_decision = tasklib.flow_decision(decision);
		tasklib.invoke_children(step, task, output, flow_decision);

		tasklib.save_task(task);
	}

	try {
		eval( sf('({0})(cb);', step.options.func) );		
	} catch(e) {
		done(e);
	}
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			func: 'function() { console.log(input); }'
		},
		data: {},
		description: ""
	},
};
