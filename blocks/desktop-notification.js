var notifier = require('node-notifier');
var winston = require('winston');
var path = require('path');
var _ = require('lodash');

var helper = require( path.join(global.paths.lib, 'helper.js') );


function create(task, step) {
	var defaults = {
		title: 'causality: <%=task.name%>',
		message: '<%=prev_step.block%>: <%=input%>'
	};
	helper.validate_step_options(step, defaults);
	helper.validate_step_data(step);

	return function(input, prev_step) {
		var message_vars = helper.message_vars(task, input, step, prev_step);

		var title = _.template(step.options.title)(message_vars);
		var message = _.template(step.options.message)(message_vars);

		notifier.notify({
			title: title,
			message: message
		});

		var output = input;
		var flow_decision = helper.flow_decision_defaults;
		helper.invoke_children(step, task, output, flow_decision);
	};
}


module.exports = {
	create: create
};
