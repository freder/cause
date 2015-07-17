'use strict';

var sf = require('sf');
var chalk = require('chalk');
var _ = require('lodash');


function fn(task, step, input, prev_step, done) {
	var cause = this;

	var title = _.template(step.options.title)(cause.message_vars);
	var message = _.template(step.options.message)(cause.message_vars);

	var line = sf(
		'{0} {1} {2}: {3}',
		cause.utils.format.cli_msg(task.name),
		chalk.blue(prev_step.block),
		chalk.white(title),
		chalk.green(message)
	);
	cause.winston.info(line);

	var output = input;
	done(null, output, null);
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			title: '<%=step.name%>',
			message: '<%=input%>'
		},
		data: {},
		description: "log to console"
	}
};
