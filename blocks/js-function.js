'use strict';

var sf = require('sf');


function fn(input, step, context, done) {
	var output;
	var decision;

	try {
		eval( sf('({0})();', step.options.func) );
	} catch(err) {
		done(err);
	}

	output = output || input;
	decision = decision || false;

	context.save();
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
