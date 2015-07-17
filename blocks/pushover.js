'use strict';

var pushover = require('pushover-notifications');
var _ = require('lodash');


function fn(task, step, input, prev_step, done) {
	var cause = this;

	var p = new pushover({
		user: cause.config.pushover.user_key,
		token: cause.config.pushover.api_key
	});

	function send(p, msg) {
		p.send(msg, function(err, result) {
			if (err) { return done(err); }
		});
	}

	var title = _.template(step.options.title)(cause.message_vars);
	var message = _.template(step.options.message)(cause.message_vars);
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
			title: "’cause: <%=task.name%>",
			message: "<%=prev_step.block>: <%=input%>"
		},
		data: {},
		description: "pushover notification"
	}
};
