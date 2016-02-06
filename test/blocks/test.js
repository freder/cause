'use strict';


function fn(input, step, context, done) {
	var output = 'output';
	var decision = true;
	done(null, output, decision);
}


module.exports = {
	fn: fn,
	success: true,
	name: 'test'
};
