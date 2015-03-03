var path = require('path');
var _ = require('lodash');
var cheerio = require('cheerio');

var config = require( path.join(global.paths.root, 'config.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var email = require( path.join(global.paths.lib, 'email.js') );


function create(task, step) {
	var defaults = {
		title: 'causality: <%=task.name%>',
		message: '<%=prev_step.block%>: <%=input%>'
	};
	step.options = tasklib.normalize_step_options(step, defaults);
	step.data = tasklib.normalize_step_data(step);

	return function(input, prev_step) {
		var message_vars = helper.message_vars(task, input, step, prev_step);

		var title = _.template(step.options.title)(message_vars);
		var message = _.template(step.options.message)(message_vars);

		email.send({
			subject: title,
			content: message
		});

		var output = input;
		var flow_decision = tasklib.flow_decision_defaults;
		tasklib.invoke_children(step, task, output, flow_decision);
	};
}


module.exports = {
	create: create
};
