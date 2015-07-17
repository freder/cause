'use strict';

var moment = require('moment');
var sf = require('sf');
var _ = require('lodash');
var R = require('ramda');


function fn(task, step, input, prev_step, done) {
	var cause = this;

	// sanity check: `limit` must be >= `at_least`
	step.options.limit = Math.max(step.options.limit, step.options.at_least);

	if (!_.isEmpty(input)) {
		// doesn't care about what the input exactly is,
		// but it has to be an array in the end.
		input = (_.isArray(input)) ? input : [input];

		// add input to buffer
		step.data.collected = step.data.collected.concat(input);
		cause.debug(
			sf('received {0} items, now: {1} / {2}',
				input.length,
				step.data.collected.length,
				step.options.limit
			)
		);
	} else {
		cause.debug('ignoring empty input: '+input);
	}

	// TODO: should it flush multiple times, or simply everything all at once?
	var all_at_once = true;

	function set_next_flush() {
		var now = moment();
		step.data.last_flush = now.format();

		var parsed = cause.utils.parse.time(step.options.or_after);
		var dur = moment.duration(parsed);
		step.data.next_flush = now.add(dur).format();
	}

	function flush() {
		var take_n = step.options.limit;
		if (all_at_once) { take_n = step.data.collected.length; }

		cause.debug('flushing ...');

		var output = R.take(take_n, step.data.collected);
		var decision = true;
		done(null, output, decision);
		step.data.collected = R.drop(take_n, step.data.collected);

		if (step.options.or_after) {
			set_next_flush();
		}
	}

	// on first run:
	if (step.options.or_after && !step.data.next_flush) {
		set_next_flush();
	}

	// flush after a certain time, no matter if threshold
	// has been reached or not.
	if (step.data.next_flush) {
		var now = moment();
		var time_to_flush = moment(step.data.next_flush);
		if (now >= time_to_flush) {
			cause.debug(step.options.or_after+' have passed');
			if (step.data.collected.length > 0) { flush(); }
		}
	}

	// flush, once threshold is reached
	if (step.data.collected.length >= step.options.limit) { flush(); }

	cause.save();
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
		},
		description: "digest: <%=options.limit%>\n<%if (options.at_least > 1) {%>at least: <%=options.at_least%><%}%>\n<%if (options.or_after) {%>or after: <%=options.or_after%><%}%>"
	}
};
