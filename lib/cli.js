var path = require('path');
var chalk = require('chalk');
var winston = require('winston');
var sf = require('sf');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var server = require( path.join(global.paths.root, 'server.js') );

require( path.join(global.paths.lib, 'log.js') ).init();


function exit(exit_code) {
	console.info(chalk.yellow('\nexiting...'));
	process.exit(exit_code || 0);
}


// https://github.com/remy/nodemon/blob/76445a628b79bc9dbf961334a6223f7951cc1d29/lib/nodemon.js#L91
function handle_command(data) {
	var command = data.toString().trim().toLowerCase();

	if (command == 'list' || command == 'ls') {
		list_tasks();
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
}


function list_tasks() {
	console.log('———————————————');
	console.log('TASKS');
	tasks.forEach(function(task, index) {
		console.log( sf('({2}) {0} ({1})', chalk.bgBlue(task.name), task.interval, index) );
	});
	console.log('———————————————');
}


function log_price_delta(price, prev_price, task) {
	var msg_vars = helper.message_vars(task/*, input, step, prev_step*/);
	var delta = helper.format_delta(price - prev_price);
	var message = chalk.green(msg_vars.format.money(price));
	winston.info( sf('{0} {1} | {2}', chalk.bgBlue(task.name), delta, message) );
}


module.exports = {
	exit: exit,
	handle_command: handle_command,
	log_price_delta: log_price_delta,
};
