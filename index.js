var glob = require('glob');
var path = require('path');
var chalk = require('chalk');
var winston = require('winston');
var _ = require('lodash');

global.paths = {
	root: __dirname,
	lib: path.join(__dirname, 'lib'),
	blocks: path.join(__dirname, 'blocks')
};

require( path.join(global.paths.lib, 'log.js') ).init();

// command line
var cli = require( path.join(global.paths.lib, 'cli.js') );
var nopt = require('nopt');
var args = global.args = nopt(cli.opts, cli.shorthands, process.argv, 2);
if (args.help) cli.show_help();
if (args.version) cli.show_version();
if (
	args.help ||
	args.version
) { cli.exit(0, true); }

var config = require( path.join(global.paths.root, 'config.js') );
var server = require( path.join(global.paths.root, 'server.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );

var debug = require('debug')('cause:'+path.basename(__filename));


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
	
	cli.list_tasks();
	server.start();
});
