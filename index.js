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
	blocks: path.join(__dirname, 'blocks'),
	modules: path.join(__dirname, 'modules')
};

require( path.join(global.paths.lib, 'log.js') ).init();

var db = require( path.join(global.paths.root, 'db.js') );
var config = require( path.join(global.paths.root, 'config.js') );
var server = require( path.join(global.paths.lib, 'server.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );
// var email = require( path.join(global.paths.lib, 'email.js') );
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
	// db('tasks').forEach(function(t) {
	_.values(tasks).forEach(function(task) {
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



var tasks = global.tasks = {
	'dell-monitor': {
		name: 'dell monitor',
		interval: 'every 15 mins',

		steps: [
			{
				id: 'price',
				block: 'amazon-price',
				options: {
					url: 'http://www.amazon.de/Dell-LED-Monitor-DisplayPort-Reaktionszeit-h%C3%B6henverstellbar/dp/B0091ME4A0/ref=sr_1_1?ie=UTF8&qid=1423474949&sr=8-1&keywords=dell+ultrasharp+u2713hm',
					currency: 'EUR'
				},
				flow: {
					'if': [ // every time the price changes
						'console',
						'desktop-notification',
						'threshold'
					]
				}
			},
			{
				id: 'console',
				block: 'log-console',
				options: {
					title: 'price changed',
					message: '<%=format.money(input)%>'
				},
				flow: {}
			},
			{
				id: 'threshold',
				block: 'threshold',
				options: {
					value: 400,
					comparison: '<='
				},
				flow: {
					'if': [ // only send notifications, once price dropped below threshold
						'email',
						'pushover'
					]
				}
			},
			{
				id: 'email',
				block: 'email-notification',
				options: {},
				flow: {}
			},
			{
				id: 'desktop-notification',
				block: 'desktop-notification',
				options: {
					message: '<%=format.money(input)%>'
				},
				flow: {}
			},
			{
				id: 'pushover',
				block: 'pushover',
				options: {
					message: 'dell monitor price: <%=format.money(input)%>'
				},
				flow: {}
			}
		],

		data: {} // TODO: keep track of how many times a task has been run
	},

	'btc-rate': {
		name: 'bitcoin rate',
		interval: 'every 10 mins',

		steps: [
			{
				id: 'price',
				block: 'bitcoin-rate',
				options: {
					'market': 'bitcoin_de'
				},
				flow: {
					'anyway': [
						'console',
						'threshold'
					]
				}
			},
			{
				id: 'console',
				block: 'log-console',
				options: {
					title: 'atm',
					message: '<%=format.money(input)%>'
				},
				flow: {}
			},
			{
				id: 'threshold',
				block: 'threshold',
				options: {
					'value': 250,
					'comparison': '>='
				},
				flow: {
					'if': [
						'desktop-notification',
						'email',
						'pushover'
					]
				}
			},
			{
				id: 'email',
				block: 'email-notification',
				options: {},
				flow: {}
			},
			{
				id: 'desktop-notification',
				block: 'desktop-notification',
				options: {
					message: '<%=format.money(input)%>'
				},
				flow: {}
			},
			{
				id: 'pushover',
				block: 'pushover',
				options: {
					message: 'bitcoin rate: <%=format.money(input)%>'
				},
				flow: {}
			}
		]
	},

	'adventuretime-episodes': {
		name: 'adventure time',
		interval: 'every 2 hours',

		steps: [
			{
				id: 'feedzzz',
				block: 'feed',
				options: {
					'url': 'http://www.watchcartoononline.com/anime/adventure-time/feed'
				},
				flow: {
					'if': ['console']
				}
			},
			{
				id: 'console',
				block: 'log-console',
				options: {
					title: 'new episodes',
					message: '<%var episodes = input.map(function(ep) { return ep.title; })%>\n<%=format.list(episodes)%>'
					// .join("\n");
				},
				flow: {}
			},
		]
	}
}


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


function load_tasks() {
	_.values(tasks).forEach(function(task) {
		// winston.info('loading task: ' + task.name);

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
	});
}

load_tasks();
_.values(tasks).forEach(function(task) {
	task._run();
	// console.log( later.schedule(task._schedule).next(2) );
});
