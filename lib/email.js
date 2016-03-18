'use strict';

const _ = require('lodash');
const nodemailer = require('nodemailer');
const mailgun = require('nodemailer-mailgun-transport');
const htmlToText = require('nodemailer-html-to-text').htmlToText;

const config = require('../config.js');
const debug = require('debug')('cause:email');


const transporter = nodemailer.createTransport(
	mailgun(config.email.mailgun)
);
transporter.use('compile', htmlToText({}));


const send = module.exports.send =
function send(msg, cb) {
	const mail = {
		from: msg.from || config.email.from,
		to: msg.to || config.email.to,
		subject: msg.subject || '’cause',
		html: msg.html || undefined,
		text: msg.text || undefined
	};

	transporter.sendMail(mail, (err, info) => {
		if (err) {
			debug(err);
		}
		debug(info);
		if (_.isFunction(cb)) {
			cb(err, info);
		}
	});
};
