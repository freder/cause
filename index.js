'use strict';

const nopt = require('nopt');
const path = require('path');
const fs = require('fs');
// const chalk = require('chalk');
const async = require('async');

const config = require('./config.js');
const common = require('./lib/common.js');
const cli = require('./lib/cli.js');
const tasklib = require('./lib/tasklib.js');


let tasks = [];


const args = nopt(cli.options, cli.shorthands, process.argv, 2);

// if --task option is given, load only one specific task file
const taskAbsPaths = (!!args.task)
	? [ path.resolve(__dirname, args.task) ]
	: tasklib.getTaskFiles(
		path.resolve(__dirname, config.paths.tasks)
	);


async.map(
	taskAbsPaths,
	tasklib.loadTaskFromFile,
	(err, tasksData) => {
		if (err) { throw err; }
		tasks = tasklib.startTasks(tasksData);
	}
);




// var libPath = path.join(process.cwd(), config.paths.lib);
// var log = require(path.join(libPath, 'log.js'));
// log.init();

// var server = require(path.join(libPath, 'server.js'));
// var utils = require(path.join(libPath, 'utils.js'));
// var tasklib = require(path.join(libPath, 'tasklib.js'));

// var debug = require('debug')('cause:'+path.basename(__filename));

// // command line
// var cli = require(path.join(libPath, 'cli.js'));
// var nopt = require('nopt');
// var args = global.args = nopt(cli.opts, cli.shorthands, process.argv, 2);
// if (args.help) { cli.show_help(); }
// if (args.version) { cli.show_version(); }
// if (args.help ||
// 	args.version) {
// 	cli.exit(0, true);
// }



// // send a notification email when the program crashes
// process.on('uncaughtException', function(err) {
// 	// don't send anything when testing a single task
// 	// if (!args.task) {
// 	// 	utils.email.send(
// 	// 		{
// 	// 			subject: "’cause crashed",
// 	// 			html: '<pre>'+err.stack+'</pre>'
// 	// 		},
// 	// 		function(/*err, info*/) {
// 	// 			cli.exit(1);
// 	// 		}
// 	// 	);
// 	// }

// 	printStacktrace(err);
// });

// process.on('SIGINT', function() {
// 	cli.exit();
// });

// if (args.task) {
// 	// load single task
// 	debug('loading '+chalk.cyan(args.task));
// 	var task_data = tasklib.load_task_from_file(args.task);
// 	task_data.interval = undefined; // only run once ...
// 	task = tasklib.prepare_task(task_data);
// 	tasklib.run_task(task, function(err, result) {
// 		process.exit(); // ... then exit
// 	});
// } else {
// 	// load all tasks in task dir
// 	debug('loading tasks from '+chalk.cyan(config.paths.tasks));
// 	glob(path.join(config.paths.tasks, '*.json'), function(err, files) {
// 		var tasks = global.tasks = files
// 			.map(tasklib.load_task_from_file)
// 			.map(tasklib.prepare_task);

// 		tasks.forEach(tasklib.run_task);

// 		// accept commands from command line
// 		process.stdin.on('data', cli.handle_command);

// 		cli.list_tasks();
// 		server.start();
// 	});
// }
