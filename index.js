var nopt = require('nopt');
var _ = require('lodash');
var path = require('path');
var chalk = require('chalk');
var winston = require('winston');

global.paths = {
	root: __dirname,
	lib: path.join(__dirname, 'lib'),
	// blocks: path.join(__dirname, 'blocks'),
	modules: path.join(__dirname, 'modules')
};

require( path.join(global.paths.lib, 'log.js') ).init();

var db = require( path.join(global.paths.root, 'db.js') );
var config = require( path.join(global.paths.root, 'config.js') );
var server = require( path.join(global.paths.lib, 'server.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );
var email = require( path.join(global.paths.lib, 'email.js') );
var task = require( path.join(global.paths.lib, 'task.js') );


/*
TODO:
- TDD
- more fine-grained, chainable blocks
	- option to save 'history' data in separate db file
	- email, pushover
	- get feed
	- filter
	- collect
- how to make 'building blocks' connectable?
- web ui
	- list tasks
		- info
	- button to manually run a task
	- add new tasks
*/


var opts = {
	'notifications': Boolean
};
var shorthands = {
	// 'n': ['--notifications']
};
var args = global.args = nopt(opts, shorthands, process.argv, 2); // TODO: avoid global variable


function list_tasks() {
	console.log('TASKS');
	db('tasks').forEach(function(t) {
		console.log( helper.module_log_format('', t) );
	});
}


// handle positional arguments
// TODO: use commander instead: https://www.npmjs.com/package/commander#git-style-sub-commands
if (args.argv.remain.length >= 1) {
	switch (args.argv.remain[0].toLowerCase()) {
		case 'list':
			list_tasks();
			process.exit();
			break;
		default:
			break;
	}	
}


// https://github.com/remy/nodemon/blob/76445a628b79bc9dbf961334a6223f7951cc1d29/lib/nodemon.js#L91
process.stdin.on('data', function(data) {
	var command = data.toString().trim().toLowerCase();
	switch (command) {
		case 'list':
			list_tasks();
			break;
		case 'restart':
			// TODO
			break;
		case 'quit':
			exit();
			break;
	}
});


function exit(exit_code) {
	exit_code = exit_code || 0;

	// do any cleanup here

	console.info(chalk.yellow('\nexiting...'));
	process.exit(exit_code);
}


process.on('uncaughtException', function(err) {
	helper.handle_error(err);
	email.send('causality: '+err.name, err.message);

	exit(1);
});


process.on('SIGINT', function() {
	exit();
});


var tasks = [];
function load_tasks() {
	db('tasks').forEach(function(task_data) {
		var line = 'loading task from db: ' + helper.module_log_format('', task_data);
		winston.info(line);

		var replace_existing = true;
		var t = task.create_task(
			task_data.module,
			_.omit(task_data, 'module', 'interval'),
			task_data.interval,
			replace_existing
		);
		tasks.push(t);
	});
}


// load tasks from db ...
load_tasks();
// ... and run them immediately
tasks.forEach(function(t) {
	t._run();
});

