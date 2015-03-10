var glob = require('glob');
var path = require('path');
var chalk = require('chalk');
var winston = require('winston');

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

/*
# ROADMAP
	- 0.6: add, change, remove tasks while tool is running
	- 0.7: validation
		- every block should specify what its input and output is
			- this also helps documenting everything
	- 0.8: project logo
	- 0.9: basic documentation / readme
	- 1.0: publish
		- blog post
*/


// https://github.com/remy/nodemon/blob/76445a628b79bc9dbf961334a6223f7951cc1d29/lib/nodemon.js#L91
process.stdin.on('data', function(data) {
	var command = data.toString().trim().toLowerCase();
	switch (command) {
		case 'list':
			helper.list_tasks();
			break;
		
		case 'quit':
		case 'q':
			exit();
			break;
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
winston.info('loading tasks from '+chalk.cyan(tasks_path));
glob(path.join(tasks_path, '*.json'), function(err, files) {
	var tasks = global.tasks = files
		.map(tasklib.load_task_from_file)
		.map(tasklib.prepare_task);

	tasks.forEach(tasklib.run_task);
});

server.start();
