var util = require('util');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var later = require('later');
var split = require('split');
var through2 = require('through2');
var moment = require('moment');
var winston = require('winston');
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {
	timestamp: function() {
		return moment().format('DD-MM-YYYY, HH:mm:ss');
	},
	colorize: true
});

var helper = require('./helper.js');
var config = require('./config.js');
var db = require('./db.js');
var email = require('./email.js');
var amazon = require('./amazon.js');
var bitcoin = require('./bitcoin.js');
var feeds = require('./feeds.js');


/*
TODO:
- persist tasks and their state
- TDD
- think of a plugin / module system
	- how to use streams to make modules connectable?
- how to update tasks while the programm is running?
*/


var nopt = require('nopt');
var opts = {
	// "foo" : [String, null],
	// "bar" : [Stream, Number],
	// "baz" : path,
	// "bloo" : [ "big", "medium", "small" ],
	// "flag" : Boolean,
	// "many" : [String, Array]
};
var shorthands = {
	// "foofoo" : ["--foo", "Mr. Foo"],
	// "b7" : ["--bar", "7"],
	// "m" : ["--bloo", "medium"],
	// "f" : ["--flag"]
};
var argv = nopt(opts, shorthands, process.argv);



process.on('uncaughtException', function(err) {
	helper.handle_error(err);
	process.exit(1);
});

process.on('SIGINT', function () {
	// TODO: clean up here

	console.info(chalk.yellow('\nexiting...'));
	process.exit();
});





var url = 'http://www.amazon.de/Dell-LED-Monitor-DisplayPort-Reaktionszeit-h%C3%B6henverstellbar/dp/B0091ME4A0/ref=sr_1_1?ie=UTF8&qid=1423474949&sr=8-1&keywords=dell+ultrasharp+u2713hm';
var check_price = amazon.create_pricecheck({
	url: url,
	threshold: 400
});


var bitcoin_price = bitcoin.create();
var adventuretime_rss = feeds.create();


function create_task(func, interval) {
	// var schedule = later.parse.recur()
	// 	.every(10).minute();

	var schedule = later.parse.text(interval);
	var timer = later.setInterval(func, schedule);

	return {
		func: func,
		schedule: schedule,
		timer: timer
	};
}

var tasks = [
	create_task(check_price, 'every 10 mins'), // amazon: monitor
	create_task(bitcoin_price, 'every 20 mins'), // bitcoin price
	create_task(adventuretime_rss, 'every 50 mins'), // adventure time
];

tasks.forEach(function(task) {
	task.func();
});





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
