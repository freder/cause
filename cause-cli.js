'use strict';

const vorpal = require('vorpal')();
const R = require('ramda');
const socketClusterClient = require('socketcluster-client');
const debugCli = require('debug')('cause:cli');

const config = require('./config.js');


const socket = socketClusterClient.connect({
	hostname: 'localhost',
	port: config.websocket.port
});

socket.on('error', (err) => {
	// catch SocketProtocolError when server is not running / quits,
	// to wait for connection
});

socket.on('error', (err) => {});

socket.on('tasks', (tasks) => {
	console.log('tasks:');
	tasks.map(R.prop('name'))
		.forEach((name, index) => {
			console.log(`${index}\t${name}`);
		});
});

socket.on('connect', () => {
	debugCli('connected');

	// get and list tasks, first thing
	socket.emit('getTasks');

	vorpal
		.history('cause-cli')
		.delimiter('=>')
		.show();
});


socket.on('disconnect', () => {
	debugCli('disconnected');
});


vorpal
	.command('ls', 'list all tasks')
	.action((args, cb) => {
		socket.emit('getTasks');
		cb();
	});

vorpal
	.command('add <filePath>', 'add task from file')
	.action((args, cb) => {
		socket.emit('addTaskFile', args.filePath);
		cb();
	});

vorpal
	.command('run <index>', 'run task by index')
	.action((args, cb) => {
		socket.emit('runTask', { index: args.index });
		cb();
	});

vorpal
	.command('rm <index>', 'remove task by index')
	.action((args, cb) => {
		socket.emit('removeTask', args.index);
		cb();
	});

vorpal
	.command('reload <index>', 'reload task from file')
	.action((args, cb) => {
		socket.emit('reloadTask', args.index);
		cb();
	});
