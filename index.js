var nopt = require('nopt');
var _ = require('lodash');
var path = require('path');
var chalk = require('chalk');
var winston = require('winston');
var later = require('later');

global.paths = {
	root: __dirname,
	lib: path.join(__dirname, 'lib'),
	blocks: path.join(__dirname, 'blocks'),
	modules: path.join(__dirname, 'modules')
};

require( path.join(global.paths.lib, 'log.js') ).init();

var db = require( path.join(global.paths.root, 'db.js') );
var config = require( path.join(global.paths.root, 'config.js') );
var server = require( path.join(global.paths.lib, 'server.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );
var email = require( path.join(global.paths.lib, 'email.js') );
var task = require( path.join(global.paths.lib, 'task.js') );


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
	db('tasks').forEach(function(t) {
		console.log( helper.module_log_format('', t) );
	});
	console.log('———————————————');
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
	// email.send('causality: '+err.name, err.message);

	exit(1);
});


process.on('SIGINT', function() {
	exit();
});



var tasks = {
	"dell-monitor": {
		name: "dell monitor",
		interval: "every 15 mins",

		steps: [
			{
				id: "111",
				module: "amazon-price",
				options: {
					url: "http://www.amazon.de/Dell-LED-Monitor-DisplayPort-Reaktionszeit-h%C3%B6henverstellbar/dp/B0091ME4A0/ref=sr_1_1?ie=UTF8&qid=1423474949&sr=8-1&keywords=dell+ultrasharp+u2713hm",
					currency: "EUR"
				}
			},
			{
				id: "555",
				module: "log-console",
				options: {
					title: "price changed",
					message: "{input}"
				}
			},
			// {
			// 	id: "222",
			// 	module: "threshold",
			// 	options: {
			// 		value: 400,
			// 		comparison: "<="
			// 	}
			// },
			// {
			// 	id: "333",
			// 	module: "email-notification",
			// 	options: {}
			// },
			{
				id: "666",
				module: "desktop-notification",
				options: {}
			},
			// {
			// 	id: "444",
			// 	module: "pushover",
			// 	options: {
			// 		message: "dell monitor price: {} EUR"
			// 	}
			// }
		],

		flow: [
			{ from: "111", to: "555" },
			// { from: "111", to: "444" },
			{ from: "111", to: "666" },
			// { from: "111", to: "333" },
		],

		data: {}
	}
}


function run_task(task) {
	var tos = task.flow.map(function(connection) {
		return connection.to;
	});
	var root_steps = task.steps.filter(function(step) {
		return tos.indexOf(step.id) === -1;
	});
	root_steps.forEach(function(root_step) {
		root_step.execute();
	});
}


function load_tasks() {
	_.keys(tasks).forEach(function(id) {
		var task = tasks[id];
		// winston.info('loading task: ' + task.name);

		task.steps.forEach(function(step) {
			var block = require( path.join(global.paths.blocks, step.module+'.js') );
			step.execute = block.create(task, step);
		});

		var run = function() {
			run_task(task)
		};
		var schedule = later.parse.text(task.interval);
		task = _.extend(task, {
			_run: run,
			_schedule: schedule,
			_timer: later.setInterval(run, schedule)
		});

		task._run();
	});
}
load_tasks();
