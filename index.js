var util = require('util');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var later = require('later');
// var split = require('split');
// var through2 = require('through2');
var moment = require('moment');
var uuid = require('node-uuid');
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
// var amazon = require('./amazon.js');
// var bitcoin = require('./bitcoin.js');
// var feeds = require('./feeds.js');


process.on('uncaughtException', function(err) {
	helper.handle_error(err);
	process.exit(1);
});


process.on('SIGINT', function() {
	// TODO: do any cleanup here
	console.info(chalk.yellow('\nexiting...'));
	process.exit();
});


function savable(task) {
	// don't persist anything prefixed with '_'
	return _.omit(task, function(value, key, object) {
		return (key[0] === '_');
	});
}


function create_task(module_name, options, interval) {
	// load module
	var p = path.join(__dirname, config.paths.modules, module_name+'.js');
	var module = require(p);

	options = _.extend(options, {
		module: module_name
	});
	var run_function = module(options);
	var schedule = later.parse.text(interval);

	var task = _.extend(options, {
		// id: uuid.v1(),
		interval: interval,
		data: null, // TODO
		_run: run_function,
		_schedule: schedule,
		_timer: later.setInterval(run_function, schedule)
	});

	db('tasks').push( savable(task) );
	return task;
}


/*
TODO:
- persist tasks and their state
- TDD
- think of a plugin / module system
- how to use streams to make modules connectable?
- how to update tasks while the programm is running?
*/


/*var nopt = require('nopt');
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
var argv = nopt(opts, shorthands, process.argv);*/




// var bitcoin_price = bitcoin.create();
// var adventuretime_rss = feeds.create();

var amazon = create_task(
	'amazon',
	{
		name: 'dell monitor price check',
		url: 'http://www.amazon.de/Dell-LED-Monitor-DisplayPort-Reaktionszeit-h%C3%B6henverstellbar/dp/B0091ME4A0/ref=sr_1_1?ie=UTF8&qid=1423474949&sr=8-1&keywords=dell+ultrasharp+u2713hm',
		threshold: 400,
		threshold_comparison: '<=',
		threshold_email: true
	},
	'every 10 mins'
);


var tasks = [
	amazon
	// create_task(bitcoin_price, 'every 20 mins'), // bitcoin price
	// create_task(adventuretime_rss, 'every 50 mins'), // adventure time
];

tasks.forEach(function(task) {
	task._run();
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
