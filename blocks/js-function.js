'use strict';

var sf = require('sf');


function fn(task, step, input, prev_step, done) {
	var cause = this;
	var output;
	var decision;

	try {
		eval( sf('({0})();', step.options.func) );
	} catch(e) {
		done(e);
	}

	output = output || input;
	decision = decision || false;

	cause.save();
	done(null, output, decision);
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
