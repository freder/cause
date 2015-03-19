var glob = require('glob');
var path = require('path');
var chalk = require('chalk');
var winston = require('winston');
var _ = require('lodash');
var open = require('open');

global.paths = {
	root: __dirname,
	lib: path.join(__dirname, 'lib'),
	blocks: path.join(__dirname, 'blocks')
};

require( path.join(global.paths.lib, 'log.js') ).init();

var config = require( path.join(global.paths.root, 'config.js') );
var server = require( path.join(global.paths.root, 'server.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );

var debug = require('debug')(path.basename(__filename));


/*
# TODO:
	- task meta data
		- how often run
	- feedparser should be a block
		- use its output in duinzigt
	- block ideas
		- save history data
		- file/dir watcher
		- buffer that releases items in intervals

# ROADMAP
	- 0.7: basic documentation / readme
	- 0.8:
		- validation: every block should specify what its input and output is
			- this also helps documenting everything
	- 0.9: project logo
	- 1.0: publish
		- blog post
*/

// https://github.com/node-red/node-red/blob/master/red.js#L50

// https://github.com/remy/nodemon/blob/76445a628b79bc9dbf961334a6223f7951cc1d29/lib/nodemon.js#L91
process.stdin.on('data', function(data) {
	var command = data.toString().trim().toLowerCase();

	if (command == 'list' || command == 'ls') {
		helper.list_tasks();
	}

	if (command == 'open') {
		open(server.url());
	}

	if (/\w+ \d+/.test(command)) {
		var splt = command.split(' ');
		var cmd = splt[0];
		var index = splt[1];
		index = parseInt(index);

		if (cmd == 'remove' || cmd == 'rm') {
			tasklib.remove_task_by_index(index);
		}
		if (cmd == 'run') {
			tasklib.run_task(global.tasks[index]);
		}
		if (cmd == 'reload') {
			// var from_file = false;
			var from_file = true;
			tasklib.reload_task_by_index(index, from_file);
		}
	}
	
	if (command == 'quit' || command == 'q' || command == 'exit') {
		exit();
	}
});


function exit(exit_code) {
	console.info(chalk.yellow('\nexiting...'));
	process.exit(exit_code || 0);
}


process.on('uncaughtException', function(err) {
	helper.handle_error(err);
	exit(1);
});


process.on('SIGINT', function() {
	exit();
});


var tasks_path = path.join(global.paths.root, config.paths.tasks);
debug('loading tasks from '+chalk.cyan(tasks_path));
glob(path.join(tasks_path, '*.json'), function(err, files) {
	var tasks = global.tasks = files
		.map(tasklib.load_task_from_file)
		.map(tasklib.prepare_task);

	tasks.forEach(tasklib.run_task);
});

server.start();
