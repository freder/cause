var pushover = require('pushover-notifications');
var path = require('path');
var _ = require('lodash');

var config = require( path.join(global.paths.root, 'config.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );


var p = new pushover({
	user: config.pushover.user_key,
	token: config.pushover.api_key
});


function send(msg) {
	p.send(msg, function(err, result) {
		if (err) { return helper.handle_error(err); }
	});
}


function fn(task, step, input, prev_step, done) {
	var message_vars = helper.message_vars(task, input, step, prev_step);

	var title = _.template(step.options.title)(message_vars);
	var message = _.template(step.options.message)(message_vars);
	send({
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
