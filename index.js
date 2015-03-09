var fs = require('fs');
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
server.start();
var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );

/*
TODO:
	- versioning
		`npm version major|minor|patch [-m "commit message"]`

# 1.0
	- core functionality into ./lib
	- validation
		- every block should specify what its input and output is
			- this also helps documenting everything
	- project logo
	- basic documentation
	- publish
		- blog post

# 2.0
	- web frontend
	- a plugin system for 3rd party blocks

# NAH, MAYBE LATER
	- history data?
	- write an example that uses node-red nodes
	- different colors for different tasks
		- white, grey, black, blue, cyan, green, magenta, red, yellow
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
var tasks;
glob(path.join(tasks_path, '*.json'), function(err, files) {
	tasks = global.tasks = files
		.map(function(file) {
			var data = fs.readFileSync(file).toString();
			var task = JSON.parse(data);
			task._file = file;
			return task;
		})
		.map(tasklib.load_task);

	tasklib.run_all(tasks);
});
