'use strict';

var sf = require('sf');
var chalk = require('chalk');
var _ = require('lodash');
var formattingUtils = require('cause-utils/formatting');


function fn(input, step, context, done) {
	var title = _.template(step.options.title)(context);
	var message = _.template(step.options.message)(context);

	var line = sf(
		'{0} {1} {2}: {3}',
		formattingUtils.cliMsg(context.task.name),
		chalk.blue(context.prevStep.block),
		chalk.white(title),
		chalk.green(message)
	);
	context.logger.log(line);

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
		description: 'log to console'
	}
};
