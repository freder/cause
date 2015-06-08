var sf = require('sf');


function fn(task, step, input, prev_step, done) {
	var that = this;
	var output;
	var decision;

	function cb() {
		output = output || input;
		decision = decision || false;

		that.save();
		done(null, output, decision);
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
