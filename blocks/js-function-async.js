'use strict';

var sf = require('sf');


function fn(input, step, context, done) {
	var output;
	var decision;

	function cb() {
		output = output || input;
		decision = decision || false;

		context.saveTask();
		done(null, output, decision);
	}

	try {
		eval( sf('({0})(cb);', step.options.func) );
	} catch(err) {
		done(err);
	}
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			func: 'function() { console.log(input); }'
		},
		data: {},
		description: ''
	},
};
