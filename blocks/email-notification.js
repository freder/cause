var _ = require('lodash');


function fn(task, step, input, prev_step, done) {
	var cause = this;
	var message_vars = cause.message_vars(task, input, step, prev_step);

	var title = _.template(step.options.title)(message_vars);
	var message = _.template(step.options.message)(message_vars);

	// override email defaults
	var to = (step.options.to) ? step.options.to : cause.config.email.to;
	var from = (step.options.from) ? step.options.from : cause.config.email.from;

	cause.utils.email.send({
		from: from,
		to: to,
		subject: title,
		html: message
	});

	var output = input;
	done(null, output, null);
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
		data: {},
		description: "email"
	}
};
