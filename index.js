'use strict';

const path = require('path');
const fs = require('fs');
const async = require('async');
const debug = require('debug')('cause');

const config = require('./config.js');
const common = require('./lib/common.js');
const cli = require('./lib/cli.js');
const tasklib = require('./lib/tasklib.js');

const nopt = require('nopt');
const args = nopt(cli.options, cli.shorthands, process.argv, 2);


// send a notification email when the program crashes
process.on('uncaughtException', (err) => {
	// don't send anything when testing a single task
	if (!args.task) {
		utils.email.send(
			{
				subject: '’cause crashed',
				html: '<pre>'+err.stack+'</pre>'
			},
			(err, info) => {
				if (err) {
					common.printStacktrace(err);
				}
				// cli.exit(1);
			}
		);
	}

	common.printStacktrace(err);
});

// if --task option is given, load only one specific task file
let taskAbsPaths;
if (!!args.task) {
	const taskFileAbsPath = path.resolve(__dirname, args.task);
	taskAbsPaths = [taskFileAbsPath];
} else {
	const tasksDirAbsPath = path.resolve(__dirname, config.paths.tasks);
	taskAbsPaths = tasklib.getTaskFiles(tasksDirAbsPath);
}

async.map(
	taskAbsPaths,
	tasklib.loadTaskFromFile,
	(err, tasksData) => {
		if (err) { throw err; }
		let tasks = tasklib.startTasks(tasksData);

		// TODO: start socket server
	}
);




// var log = require(path.join(libPath, 'log.js'));
// log.init();


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


// process.on('SIGINT', function() {
	//
// });

// 	task_data.interval = undefined; // only run once ...
