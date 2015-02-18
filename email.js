var winston = require('winston');
var nodemailer = require('nodemailer');
var mailgun = require('nodemailer-mailgun-transport');

var config = require('./config.js');


// can be re-used:
var transporter = nodemailer.createTransport( mailgun(config.email.mailgun) );


function send_email(subject, content) {	
	var mail = {
		from: config.email.from,
		to: config.email.to,
		subject: subject,
		html: content,
		text: cheerio(content).text()
	};

	transporter.sendMail(mail, function(err, info) {
		if (err) {
			winston.error(err);
		} else {
			winston.info('Message sent: ' + info.response);
		}
	});
}


module.exports = {
	send: send_email
};
