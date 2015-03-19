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
var cli = require( path.join(global.paths.lib, 'cli.js') );
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
	- 0.8:
		- validation: every block should specify what its input and output is
			- this also helps documenting everything
	- 0.9: project logo
	- 1.0: publish
		- blog post
*/

// https://github.com/node-red/node-red/blob/master/red.js#L50


process.stdin.on('data', cli.handle_command);


process.on('uncaughtException', function(err) {
	helper.handle_error(err);
	cli.exit(1);
});


process.on('SIGINT', function() {
	cli.exit();
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
