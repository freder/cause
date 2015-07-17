'use strict';

var _ = require('lodash');
var chokidar = require('chokidar');


function fn(task, step, input, prev_step, done) {
	var cause = this;


	var watchers = [];

	step.options._rules = require(step.options.rules_file);
	step.options._rules.forEach(function(rule) {
		var options = {
			persistent: true,
			ignoreInitial: true,
		};
		if (rule.ignore) { options.ignored = rule.ignore; }
		// console.log('watching', rule.watch);
		var watcher = chokidar.watch(rule.watch, options);

		_.keys(rule.on).forEach(function(event_name) {
			watcher.on(event_name, function(path) {
				rule.on[event_name](path);

				var output = path;
				var decision = true;
				done(null, output, decision);
			});
		});
	});
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			rules_file: './watch-fs-rules.js',
		},
		data: {},
		description: 'watch filesystem for changes, then do s.th.'
	}
};
