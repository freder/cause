var nopt = require('nopt');
var _ = require('lodash');
var path = require('path');
var chalk = require('chalk');
var winston = require('winston');
var later = require('later');
var sf = require('sf');

global.paths = {
	root: __dirname,
	lib: path.join(__dirname, 'lib'),
	blocks: path.join(__dirname, 'blocks')
};

require( path.join(global.paths.lib, 'log.js') ).init();

var db = require( path.join(global.paths.root, 'db.js') );
var config = require( path.join(global.paths.root, 'config.js') );
var server = require( path.join(global.paths.lib, 'server.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );

/*
TODO:
- clean up: task stuff into task.js
- core functionality should be in /lib and not indivisual blocks
- blocks should be able to do logging themselves config: { log: false }

WISH LIST:
- different colors for different tasks
	- white, grey, black, blue, cyan, green, magenta, red, yellow
- project logo
*/

var opts = {
	'notifications': Boolean
};
var shorthands = {
	// 'n': ['--notifications']
};
var args = global.args = nopt(opts, shorthands, process.argv, 2); // TODO: avoid global variables


function list_tasks() {
	console.log('———————————————');
	console.log('TASKS');
	// db('tasks').forEach(function(t) {
	tasks.forEach(function(task) {
		console.log( sf('- {0} ({1})', chalk.bgBlue(task.name), task.interval) );
	});
	console.log('———————————————');
}


// handle positional arguments
// TODO: use commander instead: https://www.npmjs.com/package/commander#git-style-sub-commands
if (args.argv.remain.length >= 1) {
	switch (args.argv.remain[0].toLowerCase()) {
		case 'list':
			list_tasks();
			exit();
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
	// email.send('causality: '+err.name, err.stack);

	exit(1);
});


process.on('SIGINT', function() {
	exit();
});


function run_task(task) {
	var tos = task.steps.reduce(function(result, step) {
		result = result.concat(step.flow['if']);
		result = result.concat(step.flow['else']);
		result = result.concat(step.flow['anyway']);
		return result;
	}, []);
	var root_steps = task.steps.filter(function(step) {
		return tos.indexOf(step.id) === -1;
	});
	root_steps.forEach(function(root_step) {
		root_step._execute();
	});
}


function validate_step_flow(flow) {
	flow = flow || {};
	if (!_.isObject(flow)) flow = {};
	if (!flow['if'] || !_.isArray(flow['if'])) flow['if'] = [];
	if (!flow['else'] || !_.isArray(flow['else'])) flow['else'] = [];
	if (!flow['anyway'] || !_.isArray(flow['anyway'])) flow['anyway'] = [];
	return flow;
}


var tasks = [];
function load_tasks() {
	// load tasks from db
	db.object.tasks.forEach(function(_task) {
		var task = _.extend({}, _task);

		winston.info('loading task: ' + task.name);

		task.steps.forEach(function(step) {
			step.flow = validate_step_flow(step.flow);

			var block = require( path.join(global.paths.blocks, step.block+'.js') );
			step._execute = block.create(task, step);
		});

		var run = function() {
			run_task(task);
		};
		var schedule = later.parse.text(task.interval);
		task = _.extend(task, {
			_run: run,
			_schedule: schedule,
			_timer: later.setInterval(run, schedule)
		});

		tasks.push(task);
		_task = tasklib.make_savable(task);
	});
}

load_tasks();
// global.tasks = tasks;
tasks.forEach(function(task) {
	task._run();
});
