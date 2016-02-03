'use strict';

var path = require('path');
var chalk = require('chalk');
var _ = require('lodash');
const R = require('ramda');
var sf = require('sf');

var cwd = process.cwd();
var config = require(path.join(cwd, 'config.js'));
var libPath = path.join(cwd, config.paths.lib);

var formattingUtils = require('cause-utils/formatting');
var utils = require( path.join(libPath, 'utils.js') );
var tasklib = require( path.join(libPath, 'tasklib.js') );
var server = require( path.join(libPath, 'server.js') );

require( path.join(libPath, 'log.js') ).init(); // TODO: needed?


var HR = '———————————————';


function exit(exit_code, silent) {
	if (!silent) { console.info(chalk.yellow('\nexiting...')); }
	process.exit(exit_code || 0);
}


// https://github.com/remy/nodemon/blob/76445a628b79bc9dbf961334a6223f7951cc1d29/lib/nodemon.js#L91
function handle_command(data) {
	var command = data.toString().trim().toLowerCase();

	if (command === 'list' || command === 'ls') {
		list_tasks();
	}

	if (command === 'open') {
		server.open_browser();
	}

	if (/\w+ \d+/.test(command)) {
		var splt = command.split(' ');
		var cmd = splt[0];
		var index = splt[1];
		index = parseInt(index);

		if (cmd === 'remove' || cmd === 'rm') {
			tasklib.remove_task_by_index(index);
		}
		if (cmd === 'run') {
			tasklib.run_task(global.tasks[index]);
		}
		if (cmd === 'reload') {
			// var from_file = false;
			var from_file = true;
			tasklib.reload_task_by_index(index, from_file);
		}
	}

	if (command === 'quit' || command === 'q' || command === 'exit') {
		exit();
	}
}


function show_commands() {
	console.log( chalk.yellow('COMMANDS') );
}


function list_tasks() {
	console.log(HR);
	console.log('TASKS');
	tasks.forEach(function(task, index) {
		console.log( sf('({0}) {1}', index, formattingUtils.cli_msg(task.name, task.interval)) );
	});
	console.log(HR);
}


function show_version() {
	var pkg = require(path.join(cwd, 'package.json'));
	console.log( chalk.green(pkg.version) );
}


function show_help() {
	show_usage();
}


function show_usage() {
	console.log( chalk.yellow('USAGE') );
	R.keys(cliOptions).forEach(function(key) {
		console.log(usage_for_option(cliOptions[key]));
	});
}


function usage_for_option(o) {
	return sf('-{shorthand}, --{name}{tabs}{description}', o);
}


var cliOptions = {
	// 'version': {
	// 	argumentType: Boolean,
	// 	shorthand: 'v',
	// 	tabs: '\t\t',
	// 	description: 'show version'
	// },
	// 'help': {
	// 	argumentType: Boolean,
	// 	shorthand: 'h',
	// 	tabs: '\t\t',
	// 	description: 'show help'
	// },
	'task': {
		argumentType: String,
		shorthand: 't',
		tabs: '\t\t',
		description: 'run single task file'
	},
	'once': {
		argumentType: Boolean,
		shorthand: 'o',
		tabs: '\t\t',
		description: 'run only once'
	},
	// 'open-frontend': {
	// 	argumentType: Boolean,
	// 	shorthand: 'o',
	// 	tabs: '\t',
	// 	description: 'open web frontend'
	// }
};


// add name field
R.keys(cliOptions)
	.forEach(function(key) {
		cliOptions[key].name = key;
	});

const options = module.exports.options =
R.keys(cliOptions)
	.reduce(function(result, key) {
		const option = cliOptions[key];
		result[key] = option.argumentType;
		return result;
	}, {});

const shorthands = module.exports.shorthands =
R.keys(cliOptions)
	.reduce(function(result, key) {
		const option = cliOptions[key];
		result[option.shorthand] = '--' + key;
		return result;
	}, {});


// module.exports = {
	// options: options,
	// shorthands: shorthands,

	// exit: exit,
	// handle_command: handle_command,

	// show_version: show_version,
	// show_usage: show_usage,
	// show_help: show_help,

	// list_tasks: list_tasks
// };
