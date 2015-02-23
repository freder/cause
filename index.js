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
- write wrapper for existing node-red nodes
- option to save 'history' data in separate db file
- TDD
- how to use streams to make 'building blocks' connectable?
	- look at stream playground
- how to update tasks while the programm is running?
	- probably via ui
- web ui
	- api
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
			db('tasks').forEach(function(t) {
				console.log( helper.module_log_format('', t) );
			});
			process.exit();
			break;
		default:
			break;
	}	
}


process.on('uncaughtException', function(err) {
	helper.handle_error(err);
	email.send('causality: '+err.name, err.message);

	process.exit(1);
});


process.on('SIGINT', function() {
	// do any cleanup here

	// db.saveSync();

	console.info(chalk.yellow('\nexiting...'));
	process.exit();
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

