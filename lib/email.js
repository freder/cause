var path = require('path');
var winston = require('winston');
var nodemailer = require('nodemailer');
var mailgun = require('nodemailer-mailgun-transport');
var htmlToText = require('nodemailer-html-to-text').htmlToText;

var config = require( path.join(global.paths.root, 'config.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );

var debug = require('debug')('cause:lib:'+path.basename(__filename));


var transporter = nodemailer.createTransport( mailgun(config.email.mailgun) );
transporter.use('compile', htmlToText({}));


function send(msg) {
	var mail = {
		from: msg.from || config.email.from,
		to: msg.to || config.email.to,
		subject: msg.subject || "'cause",
		html: msg.html || undefined,
		text: msg.text || undefined
	};

	transporter.sendMail(mail, function(err, info) {
		if (err) debug(err);
		debug(info);
	});
}


module.exports = {
	send: send
};
