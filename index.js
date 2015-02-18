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

var helper = require('./helper.js');
var config = require('./config.js');
var email = require('./email.js');
var amazon = require('./amazon.js');


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



process.on('uncaughtException', function(err) {
	helper.handle_error(err);
	process.exit(1);
});

process.on('SIGINT', function () {
	// TODO: clean up here

	console.info(chalk.yellow('\nexiting...'));
	process.exit();
});


// var db = lowdb('db.json', {
// 	autosave: true, // automatically save on change
// 	async: true // async write
// });
// db('posts').push({ title: 'lowdb is awesome' });
// db('posts').find({ title: 'lowdb is awesome' });




// var tasks = [
// 	{
// 		type: 
// 	}
// ]



var url = 'http://www.amazon.de/Dell-LED-Monitor-DisplayPort-Reaktionszeit-h%C3%B6henverstellbar/dp/B0091ME4A0/ref=sr_1_1?ie=UTF8&qid=1423474949&sr=8-1&keywords=dell+ultrasharp+u2713hm';
var check_price = amazon.create_pricecheck({
	url: url,
	threshold: 400
});
check_price();



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
// 	.on('error', helper.handle_error)
// 	.pipe(split())
// 	.pipe(transform_json)
// 	.pipe(transform_format);
