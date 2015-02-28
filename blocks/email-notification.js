var path = require('path');
var _ = require('lodash');
var cheerio = require('cheerio');
var nodemailer = require('nodemailer');
var mailgun = require('nodemailer-mailgun-transport');

var config = require( path.join(global.paths.root, 'config.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );


var transporter = nodemailer.createTransport( mailgun(config.email.mailgun) );


function send_email(msg) { // TODO: put into library
	var mail = {
		from: config.email.from,
		to: config.email.to,
		subject: msg.subject,
		html: msg.content,
		text: cheerio(msg.content.replace('<br>', '\n')).text()
	};

	transporter.sendMail(mail, function(err, info) {
		if (err) throw err;
	});
}


function create(task, step) {
	var defaults = {
		title: 'causality: <%=task.name%>',
		message: '<%=prev_step.block%>: <%=input%>'
	};
	tasklib.validate_step_options(step, defaults);
	tasklib.validate_step_data(step);

	return function(input, prev_step) {
		var message_vars = helper.message_vars(task, input, step, prev_step);

		var title = _.template(step.options.title)(message_vars);
		var message = _.template(step.options.message)(message_vars);

		send_email({
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
