'use strict';

var moment = require('moment');
var sf = require('sf');
var _ = require('lodash');
var R = require('ramda');
var parsingUtils = require('cause-utils/parsing');


function fn(input, step, context, done) {
	// sanity check: `limit` must be >= `atLeast`
	step.options.limit = Math.max(step.options.limit, step.options.atLeast);

	if (!_.isEmpty(input)) {
		// doesn't care about what the input exactly is,
		// but it has to be an array in the end.
		input = (_.isArray(input)) ? input : [input];

		// add input to buffer
		step.data.collected = step.data.collected.concat(input);
		context.debug(
			sf('received {0} items, now: {1} / {2}',
				input.length,
				step.data.collected.length,
				step.options.limit
			)
		);
	} else {
		context.debug('ignoring empty input: '+input);
	}

	// TODO: should it flush multiple times, or simply everything all at once?
	var allAtOnce = true;

	function setNextFlush() {
		var now = moment();
		step.data.lastFlush = now.format();

		var parsed = parsingUtils.time(step.options.orAfter);
		var dur = moment.duration(parsed);
		step.data.nextFlush = now.add(dur).format();
	}

	function flush() {
		var takeN = step.options.limit;
		if (allAtOnce) { takeN = step.data.collected.length; }

		context.debug('flushing ...');

		var output = R.take(takeN, step.data.collected);
		var decision = true;
		done(null, output, decision);
		step.data.collected = R.drop(takeN, step.data.collected);

		if (step.options.orAfter) {
			setNextFlush();
		}
	}

	// on first run:
	if (step.options.orAfter && !step.data.nextFlush) {
		setNextFlush();
	}

	// flush after a certain time, no matter if threshold
	// has been reached or not.
	if (step.data.nextFlush) {
		var now = moment();
		var timeToFlush = moment(step.data.nextFlush);
		if (now >= timeToFlush) {
			context.debug(step.options.orAfter+' have passed');
			if (step.data.collected.length > 0) { flush(); }
		}
	}

	// flush, once threshold is reached
	if (step.data.collected.length >= step.options.limit) { flush(); }

	context.saveTask();
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			limit: 5,
			atLeast: 1,
			orAfter: false
		},
		data: {
			collected: [],
			lastFlush: 0,
			// nextFlush: undefined
		},
		description: "digest: <%=options.limit%>\n<%if (options.atLeast > 1) {%>at least: <%=options.atLeast%><%}%>\n<%if (options.orAfter) {%>or after: <%=options.orAfter%><%}%>"
	}
};
