'use strict';

const vorpal = require('vorpal')();
const R = require('ramda');
const io = require('socket.io-client');
const debugCli = require('debug')('cause:cli');

const config = require('./config.js');


const socket = io('http://localhost:' + config.server.websocket_port);

socket.on('connect', function() {
	debugCli('connected');

	vorpal
		.history('cause-cli')
		.delimiter('=>')
		.show();
});


socket.on('disconnect', function() {
	debugCli('disconnected');
});


socket.on('tasks', function(tasks) {
	tasks.map(R.prop('name'))
		.forEach((name) => {
			console.log(name);
		});
});


vorpal
	.command('tasks', 'list all tasks')
	.action((args, cb) => {
		socket.emit('getTasks');
		cb();
	});


vorpal
	.command('addtask <filePath>', 'add task from file')
	.action((args, cb) => {
		socket.emit('addTaskFile', args.filePath);
		cb();
	});

