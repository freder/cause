var path = require('path');
var _ = require('lodash');

var config = require( path.join(global.paths.root, 'config.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var email = require( path.join(global.paths.lib, 'email.js') );


function fn(task, step, input, prev_step) {
	var message_vars = helper.message_vars(task, input, step, prev_step);

	var title = _.template(step.options.title)(message_vars);
	var message = _.template(step.options.message)(message_vars);

	// override email defaults
	var to = (step.options.to) ? step.options.to : config.email.to;
	var from = (step.options.from) ? step.options.from : config.email.from;

	email.send({
		from: from,
		to: to,
		subject: title,
		html: message
	});

	var output = input;
	var flow_decision = tasklib.flow_decision_defaults;
	tasklib.invoke_children(step, task, output, flow_decision);
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			from: undefined,
			to: undefined,
			title: "'cause: <%=task.name%>",
			message: "<%=prev_step.block%>: <%=input%>"
		},
		data: {}
	}
};
