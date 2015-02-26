var notifier = require('node-notifier');
var winston = require('winston');
var path = require('path');
var _ = require('lodash');
var fmt = require('simple-fmt');
var cheerio = require('cheerio');
var nodemailer = require('nodemailer');
var mailgun = require('nodemailer-mailgun-transport');

var cfg = require( path.join(global.paths.root, 'config.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );


// can be re-used
var transporter = nodemailer.createTransport( mailgun(cfg.email.mailgun) );


function send_email(subject, content) {
	var mail = {
		from: cfg.email.from,
		to: cfg.email.to,
		subject: subject,
		html: content,
		text: cheerio(content.replace('<br>', '\n')).text()
	};

	transporter.sendMail(mail, function(err, info) {
		if (err) throw err;
	});
}


function create(task, step) {
	return function(input, previous_step) {
		// sanity check
		var config = step.config || {};
		config = _.defaults(config, {
			title: fmt('causality: {0}', task.name),
			message: fmt('{0}: {}', previous_step.module)
		});

		// do the work
		var title = helper.format(config.title, input);
		var message = helper.format(config.message, input);
		send_email(title, message);

		// pass through
		var output = input;

		// invoke children
		var children = helper.get_children(step, task);
		children.forEach(function(child) {
			child.execute(output, step);
		});
	};
}


module.exports = {
	create: create
};
