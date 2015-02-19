var winston = require('winston');
var cheerio = require('cheerio');
var nodemailer = require('nodemailer');
var mailgun = require('nodemailer-mailgun-transport');

var config = require('./config.js');
var helper = require('./helper.js');


// can be re-used:
var transporter = nodemailer.createTransport( mailgun(config.email.mailgun) );


function send_email(subject, content) {	
	var mail = {
		from: config.email.from,
		to: config.email.to,
		subject: subject,
		html: content,
		text: cheerio(content.replace('<br>', '\n')).text()
	};

	transporter.sendMail(mail, function(err, info) {
		if (err) {
			helper.handle_error(err);
		} else {
			// winston.info('Message sent: ' + info.response);
		}
	});
}


module.exports = {
	send: send_email
};
