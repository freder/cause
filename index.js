'use strict';

const cli = require('./lib/cli.js');
const nopt = require('nopt');
const args = nopt(cli.options, cli.shorthands, process.argv, 2);

if (args.help) {
	cli.showHelp();
	process.exit();
} else if (args.version) {
	cli.showVersion();
	process.exit();
}

const path = require('path');
const async = require('async');

const config = require('./config.js');
const socket = require('./lib/socket.js');
const common = require('./lib/common.js');
const tasklib = require('./lib/tasklib.js');
const email = require('./lib/email.js');

// send a notification email when the program crashes
process.on('uncaughtException', (err) => {
	// don't send anything when testing a single task
	if (!!args.email) {
		const opts = {
			subject: '’cause crashed',
			html: `<pre>${err.stack}</pre>`
		};
		email.send(
			opts,
			(err, info) => {
				if (err) {
					common.printStacktrace(err);
				}
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

		if (!!args.once || !!args.task) {
			tasksData.forEach((taskData) => {
				taskData.interval = undefined;
			});
		}

		const port = config.websocket.port;
		const socketServer = socket.createSocketServer(port);
		const logger = require('./lib/logger.js').init(socketServer);
		logger.info(`web socket listening on port ${port}`);

		const tasks = tasklib.startTasks(tasksData, logger);
		socket.startSocketServer(socketServer, tasks);
	}
);
