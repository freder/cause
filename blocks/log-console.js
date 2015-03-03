var sf = require('sf');
var winston = require('winston');
var chalk = require('chalk');
var path = require('path');
var _ = require('lodash');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );


function create(task, step) {
	var defaults = {
		title: '<%=step.name%>',
		message: '<%=input%>'
	};
	step.options = tasklib.normalize_step_options(step, defaults);
	step.data = tasklib.normalize_step_data(step);

	return function(input, prev_step) {
		var message_vars = helper.message_vars(task, input, step, prev_step);

		var title = _.template(step.options.title)(message_vars);
		var message = _.template(step.options.message)(message_vars);

		var line = sf(
			'{0} {1} {2}: {3}',
			chalk.bgBlue(task.name),
			chalk.blue(prev_step.block),
			chalk.white(title),
			chalk.green(message)
		);
		winston.info(line);

		var output = input;
		var flow_decision = tasklib.flow_decision_defaults;
		tasklib.invoke_children(step, task, output, flow_decision);
	};
}


module.exports = {
	create: create
};
