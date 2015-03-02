var path = require('path');
var winston = require('winston');
var nodemailer = require('nodemailer');
var mailgun = require('nodemailer-mailgun-transport');
var htmlToText = require('nodemailer-html-to-text').htmlToText;

var config = require( path.join(global.paths.root, 'config.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );


var transporter = nodemailer.createTransport( mailgun(config.email.mailgun) );
transporter.use('compile', htmlToText({}));


function send(msg) {
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


module.exports = {
	send: send
};
