'use strict';

var _ = require('lodash');


function fn(input, step, context, done) {
	var cause = this;

	var title = _.template(step.options.title)(context);
	var message = _.template(step.options.message)(context);

	// override email defaults
	var to = (step.options.to)
		? step.options.to
		: context.config.email.to;
	var from = (step.options.from)
		? step.options.from
		: context.config.email.from;

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
			title: '’cause: <%=task.name%>',
			message: '<%=prev_step.block%>: <%=input%>'
		},
		data: {},
		description: 'email'
	}
};
