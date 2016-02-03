'use strict';

var pushover = require('pushover-notifications');
var _ = require('lodash');


function fn(input, step, context, done) {
	var p = new pushover({
		user: context.config.pushover.user_key,
		token: context.config.pushover.api_key
	});

	function send(p, msg) {
		p.send(msg, function(err, result) {
			if (err) { return done(err); }
		});
	}

	var title = _.template(step.options.title)(context);
	var message = _.template(step.options.message)(context);
	send(p, {
		title: title,
		message: message
	});

	// pass through
	var output = input;
	done(null, output, null);
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			title: '’cause: <%=task.name%>',
			message: '<%=prevStep.block>: <%=input%>'
		},
		data: {},
		description: 'pushover notification'
	}
};
