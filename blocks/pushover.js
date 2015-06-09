var pushover = require('pushover-notifications');
var _ = require('lodash');


function fn(task, step, input, prev_step, done) {
	var that = this;

	var p = new pushover({
		user: that.config.pushover.user_key,
		token: that.config.pushover.api_key
	});

	function send(p, msg) {
		p.send(msg, function(err, result) {
			if (err) { return that.handle_error(err); }
		});
	}

	var message_vars = that.utils.message_vars(task, input, step, prev_step);
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
