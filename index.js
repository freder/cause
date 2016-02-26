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
const debugCli = require('debug')('cause:cli');
const io = require('socket.io');

const config = require('./config.js');
const logger = require('./lib/logger.js');
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

		let tasks = tasklib.startTasks(tasksData);

		// start web socket server
		const socketServer = io.listen(config.websocket.port);
		logger.info(`web socket listening on port ${config.websocket.port}`);

		socketServer.sockets.on('connection', (socket) => {
			debugCli('client connected');

			socket.on('getTasks', () => {
				socket.emit('tasks', tasks);
			});

			socket.on('addTaskFile', (filePath) => {
				const absPath = path.resolve(__dirname, filePath);
				tasklib.loadTaskFromFile(
					absPath,
					(err, taskData) => {
						tasks = tasklib.addAndStartTask(tasks, taskData);
						socket.emit('tasks', tasks);
					}
				);
			});

			socket.on('removeTask', (index) => {
				tasks = tasklib.removeTaskByIndex(tasks, index);
				socket.emit('tasks', tasks);
			});

			socket.on('runTask', (arg) => {
				let task;
				if (arg.slug !== undefined) {
					task = common.getItemByKey('slug', tasks, arg.slug);
				} else if (arg.index !== undefined) {
					task = tasks[arg.index];
				}

				if (task) {
					tasklib.runTask(task);
				}
			});

			socket.on('reloadTask', (index) => {
				tasklib.reloadTaskByIndex(
					tasks,
					index,
					(err, taskData) => {
						tasks = tasklib.removeTaskByIndex(tasks, index);
						tasks = tasklib.addAndStartTask(tasks, taskData);
						socket.emit('tasks', tasks);
					}
				);
			});
		});
	}
);
