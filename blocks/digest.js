var path = require('path');
var moment = require('moment');
var _ = require('lodash');
var R = require('ramda');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );


function fn(task, step, input, prev_step) {
	if (!_.isArray(input)) {
		input = [input];
	}
	step.data.collected = step.data.collected.concat(input);

	function set_next_flush() {
		var now = moment();
		step.data.last_flush = now.format();

		var parsed = helper.parse_time(step.options.or_after);
		var dur = moment.duration(parsed);
		step.data.next_flush = now.add(dur).format();
	}

	function flush() {
		var output = R.take(step.options.limit, step.data.collected);
		var flow_decision = tasklib.flow_decision(true);
		tasklib.invoke_children(step, task, output, flow_decision);
		step.data.collected = R.drop(step.options.limit, step.data.collected);

		if (step.options.or_after) {
			set_next_flush();
		}
	}

	// TODO: maybe blocks like this should provide their own `init()` function
	// for all the things that go further than normalization ...
	// on first run:
	if (step.options.or_after && !step.data.next_flush) {
		set_next_flush();
	}

	if (step.data.next_flush) {
		var now = moment();
		var then = moment(step.data.next_flush);
		if (now >= then && step.data.collected.length >= step.options.at_least) {
			flush();
		}
	}

	while (step.data.collected.length >= step.options.limit) {
		flush();
	}

	tasklib.save_task(task);
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			limit: 5,
			at_least: 1,
			or_after: false
		},
		data: {
			collected: [],
			last_flush: 0,
			// next_flush: undefined
		}		
	}
};
