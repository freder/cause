'use strict';

const path = require('path');
const http = require('http');
const socketClusterServer = require('socketcluster-server');
const debugSocket = require('debug')('cause:socket');

const tasklib = require('./tasklib.js');
const common = require('./common.js');


module.exports.startSocketServer =
function startSocketServer(port, tasks) {
	const httpServer = http.createServer();
	httpServer.listen(port);

	const socketServer = socketClusterServer.attach(httpServer);

	socketServer.on('connection', (socket) => {
		debugSocket('client connected');

		socket.on('getTasks', () => {
			socketServer.exchange.publish('tasks', tasks);
			socket.emit('tasks', tasks);
		});

		socket.on('addTaskFile', (filePath) => {
			const absPath = path.resolve(__dirname, filePath);
			tasklib.loadTaskFromFile(
				absPath,
				(err, taskData) => {
					tasks = tasklib.addAndStartTask(tasks, taskData);
					socketServer.exchange.publish('tasks', tasks);
				}
			);
		});

		socket.on('removeTask', (index) => {
			tasks = tasklib.removeTaskByIndex(tasks, index);
			socketServer.exchange.publish('tasks', tasks);
		});

		socket.on('runTask', (args={}) => {
			let task;
			if (args.slug !== undefined) {
				task = common.getItemByKey('slug', tasks, args.slug);
			} else if (args.index !== undefined) {
				task = tasks[args.index];
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
					socketServer.exchange.publish('tasks', tasks);
				}
			);
		});
	});
};
