'use strict';

const path = require('path');
const http = require('http');
const socketClusterServer = require('socketcluster-server');
const debugSocket = require('debug')('cause:socket');

const tasklib = require('./tasklib.js');
const common = require('./common.js');


const publishTasks =
module.exports.publishTasks =
function publishTasks(socketServer, tasks) {
	socketServer.exchange.publish('tasks', tasks);
};


const getTasks =
module.exports.getTasks =
function getTasks(socketServer, socket, tasks, cb) {
	socket.emit('tasks', tasks);
	cb(tasks);
};


const addTaskFile =
module.exports.addTaskFile =
function addTaskFile(socketServer, socket, tasks, cb, filePath) {
	const absPath = path.resolve(__dirname, filePath);
	tasklib.loadTaskFromFile(
		absPath,
		(err, taskData) => {
			const newTasks = tasklib.addAndStartTask(tasks, taskData);
			publishTasks(socketServer, newTasks);
			cb(newTasks);
		}
	);
};


const removeTask =
module.exports.removeTask =
function removeTask(socketServer, socket, tasks, cb, index) {
	const newTasks = tasklib.removeTaskByIndex(tasks, index);
	publishTasks(socketServer, newTasks);
	cb(newTasks);
};


const runTask =
module.exports.runTask =
function runTask(socketServer, socket, tasks, cb, args={}) {
	let task;
	if (args.slug !== undefined) {
		task = common.getItemByKey('slug', tasks, args.slug);
	} else if (args.index !== undefined) {
		task = tasks[args.index];
	}

	if (task) {
		tasklib.runTask(task);
	}
	cb(tasks);
};


const reloadTask =
module.exports.reloadTask =
function reloadTask(socketServer, socket, tasks, cb, index) {
	tasklib.reloadTaskByIndex(
		tasks,
		index,
		(err, taskData) => {
			let newTasks = tasklib.removeTaskByIndex(tasks, index);
			newTasks = tasklib.addAndStartTask(tasks, taskData);
			publishTasks(socketServer, newTasks);
			cb(newTasks);
		}
	);
};


const startSocketServer =
module.exports.startSocketServer =
function startSocketServer(port, tasks) {
	const httpServer = http.createServer();
	httpServer.listen(port);

	const socketServer = socketClusterServer.attach(httpServer);

	const handlers = [
		{ eventName: 'getTasks', handlerFunction: getTasks },
		{ eventName: 'addTaskFile', handlerFunction: addTaskFile },
		{ eventName: 'removeTask', handlerFunction: removeTask },
		{ eventName: 'runTask', handlerFunction: runTask },
		{ eventName: 'reloadTask', handlerFunction: reloadTask },
	];

	socketServer.on('connection', (socket) => {
		debugSocket('client connected');

		handlers.forEach((item) => {
			const { eventName, handlerFunction } = item;
			socket.on(eventName,
				(...args) => {
					handlerFunction.apply(
						null, [
							socketServer, socket, tasks,
							(newTasks) => { tasks = newTasks; },
							...args
						]
					);
				}
			);
		});
	});
};
