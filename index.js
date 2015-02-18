var util = require('util');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var later = require('later');
var request = require('request');
var FeedParser = require('feedparser');
var split = require('split');
var through2 = require('through2');
var lowdb = require('lowdb');
var cheerio = require('cheerio');
var moment = require('moment');
var winston = require('winston');
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
	timestamp: function() {
		return moment().format('DD-MM-YYYY, hh:mm:ss');
	},
	colorize: true
});
var config = require('./config.js')


var nopt = require('nopt');
var opts = {
	// "foo" : [String, null],
	// "bar" : [Stream, Number],
	// "baz" : path,
	// "bloo" : [ "big", "medium", "small" ],
	// "flag" : Boolean,
	// "pick" : Boolean,
	// "many" : [String, Array]
};
var shorthands = {
	// "foofoo" : ["--foo", "Mr. Foo"],
	// "b7" : ["--bar", "7"],
	// "m" : ["--bloo", "medium"],
	// "p" : ["--pick"],
	// "f" : ["--flag"]
};
var argv = nopt(opts, shorthands, process.argv);
// console.log(argv);


// var schedule = later.parse.recur().every(10).minute();
// // var next10 = later.schedule(schedule).next(10);
// var timer = later.setInterval(function() {
// 	check_price();
// }, schedule);


function handle_error(err) {
	util.error(chalk.red(err));
}

process.on('uncaughtException', function(err) {
	handle_error(err);
	process.exit(1);
});

process.on('SIGINT', function () {
	// TODO: clean up
	console.info('\n');
	console.info(chalk.yellow('exiting...'));
	process.exit();
});


// var db = lowdb('db.json', {
// 	autosave: true, // automatically save on change
// 	async: true // async write
// });
// db('posts').push({ title: 'lowdb is awesome' });
// db('posts').find({ title: 'lowdb is awesome' });




function send_email(subject, content) {
	var nodemailer = require('nodemailer');
	var mailgun = require('nodemailer-mailgun-transport');

	var transporter = nodemailer.createTransport( mailgun(config.email.mailgun) );
	
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
send_email('another test', '<a href="http://www.google.de">google</a>');




// var url = 'http://www.amazon.de/Dell-LED-Monitor-DisplayPort-Reaktionszeit-h%C3%B6henverstellbar/dp/B0091ME4A0/ref=sr_1_1?ie=UTF8&qid=1423474949&sr=8-1&keywords=dell+ultrasharp+u2713hm';
// function check_price() {
// 	request(url, function(err, response, html) {
// 		if (err) {
// 			handle_error(err);
// 			return;
// 		}

// 		var $ = cheerio.load(html);
// 		var price = $('#priceblock_ourprice').text();
// 		price = price.replace(/EUR/, '').replace(' ', '').replace(',', '.');
// 		price = parseFloat(price);
// 		winston.info(price);
// 	});
// }
// check_price();



// var seen = {};
// feedparser.on('readable', function() {
// 	var stream = this;
// 	var article;
// 	while (article = stream.read()) {
// 		var time = article.date.getTime();
// 		if (!(article.guid in seen) || (seen[article.guid] !== 0 && seen[article.guid] != time)) {
// 			seen[article.guid] = article.date ? time : 0;
// 		}
// 	}
// });



// var transform_json = through2.obj(
// 	function(line, enc, cb) {
// 		line = line.replace(/^module.exports * = * /, '');
// 		line = line.replace(/[ \t]*[;]$/, '');
// 		this.push(line);
// 		cb();
// 	}
// );

// var transform_format = through2.obj(
// 	function(line, enc, cb) {
// 		console.log(line);
// 		this.push(line);
// 		cb();
// 	}
// );


// fs.createReadStream('test.txt')
// 	.on('error', handle_error)
// 	.pipe(split())
// 	.pipe(transform_json)
// 	.pipe(transform_format);
