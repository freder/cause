'use strict';

var notifier = require('node-notifier');
var _ = require('lodash');


function fn(task, step, input, prev_step, done) {
	var cause = this;

	var title = _.template(step.options.title)(cause.message_vars);
	var message = _.template(step.options.message)(cause.message_vars);

	notifier.notify({
		title: title,
		message: message
	});

	var output = input;
	done(null, output, null);
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			title: "’cause: <%=task.name%>",
			message: "<%=prev_step.block%>: <%=input%>"
		},
		data: {},
		description: "desktop notification"
	},
};
