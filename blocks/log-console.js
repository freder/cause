var sf = require('sf');
var chalk = require('chalk');
var _ = require('lodash');


function fn(task, step, input, prev_step, done) {
	var that = this;
	var message_vars = that.utils.message_vars(task, input, step, prev_step);

	var title = _.template(step.options.title)(message_vars);
	var message = _.template(step.options.message)(message_vars);

	var line = sf(
		'{0} {1} {2}: {3}',
		that.utils.format.cli_msg(task.name),
		chalk.blue(prev_step.block),
		chalk.white(title),
		chalk.green(message)
	);
	that.winston.info(line);

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
