var nopt = require('nopt');
var _ = require('lodash');
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


/*
TODO:
- option to save 'history' data in separate db file
- TDD
- how to use streams to make 'building blocks' connectable?
	- look at stream playground
- how to update tasks while the programm is running?
- web ui
	- button to manually run a task
*/

var opts = {
	'notifications': Boolean
};
var shorthands = {
	// 'n': ['--notifications']
};
var args = global.args = nopt(opts, shorthands, process.argv, 2); // TODO: avoid global variable

// handle positional arguments
// TODO: use commander instead: https://www.npmjs.com/package/commander#git-style-sub-commands
if (args.argv.remain.length >= 1) {
	switch (args.argv.remain[0].toLowerCase()) {
		case 'list':
			console.log('TASKS');
			db('tasks').forEach(function(task) {
				console.log( helper.module_log_format('', task) );
			});
			process.exit();
			break;
		default:
			break;
	}	
}


process.on('uncaughtException', function(err) {
	helper.handle_error(err);
	process.exit(1);
});


process.on('SIGINT', function() {
	db.saveSync();

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


function create_task(module_name, options, interval, replace_existing) {
	replace_existing = replace_existing || false;

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
		data: {},
		_run: run_function,
		_schedule: schedule,
		_timer: later.setInterval(run_function, schedule)
	});

	var results = db('tasks').get_all_by_name(task.name);
	if (results.length > 0) {
		// task already exists in db
		if (replace_existing) {
			winston.info('replacing existing task');
			var existing_task = results[0];
			existing_task = task;
		} else {
			var message = 'task with that name already exists in db: ' + task.name;
			helper.handle_error(message);
			throw message

			// TODO: add one with same name?
			// db('tasks').push( savable(task) );
		}
	}
	db.save();

	tasks.push(task);
	return task;
}


// var amazon = create_task(
// 	'amazon',
// 	{
// 		name: 'dell monitor price check',
// 		url: 'http://www.amazon.de/Dell-LED-Monitor-DisplayPort-Reaktionszeit-h%C3%B6henverstellbar/dp/B0091ME4A0/ref=sr_1_1?ie=UTF8&qid=1423474949&sr=8-1&keywords=dell+ultrasharp+u2713hm',
// 		threshold: 400,
// 		threshold_comparison: '<=',
// 		threshold_email: true,
// 		notifications: true
// 	},
// 	'every 15 mins'
// );

// var bitcoin = create_task(
// 	'bitcoin',
// 	{
// 		name: 'btc rate',
// 		market: 'bitcoin_de',
// 		threshold: 250,
// 		threshold_comparison: '>=',
// 		threshold_email: true
// 	},
// 	'every 30 mins'
// );

// var adventuretime = create_task(
// 	'feed',
// 	{
// 		name: 'adventure time episodes',
// 		url: 'http://www.watchcartoononline.com/anime/adventure-time/feed',
// 		// email: true
// 	},
// 	'every 2 hours'
// );


// var tasks = [
// 	amazon,
// 	bitcoin,
// 	adventuretime
// ];


var tasks = [];
function load_tasks() {
	db('tasks').forEach(function(task_data) {
		var line = 'loading task from db: ' + helper.module_log_format('', task_data);
		winston.info(line);

		var replace_existing = true;
		var task = create_task(
			task_data.module,
			_.omit(task_data, 'module', 'interval'),
			task_data.interval,
			replace_existing
		);
	});
}

// load tasks from db ...
load_tasks();
// ... and run them immediately
tasks.forEach(function(task) {
	task._run();
});

