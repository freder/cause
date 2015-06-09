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
			if (err) { return cause.handle_error(err); }
		});
	}

	var message_vars = cause.message_vars(task, input, step, prev_step);
	var title = _.template(step.options.title)(message_vars);
	var message = _.template(step.options.message)(message_vars);
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
			title: "'cause: <%=task.name%>",
			message: "<%=prev_step.block>: <%=input%>"
		},
		data: {},
		description: "pushover notification"
	}
};
