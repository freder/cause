var glob = require('glob');
var path = require('path');
var chalk = require('chalk');
var _ = require('lodash');

global.paths = {
	root: __dirname,
	lib: path.join(__dirname, 'lib')
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
var server = require( path.join(global.paths.lib, 'server.js') );
var utils = require( path.join(global.paths.lib, 'utils.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );

var debug = require('debug')('cause:'+path.basename(__filename));


process.stdin.on('data', cli.handle_command);

process.on('uncaughtException', function(err) {	
	utils.email.send(
		{
			subject: "'cause crashed",
			html: '<pre>'+err.stack+'</pre>'
		},
		function(/*err, info*/) {
			cli.exit(1);
		}
	);

	utils.misc.handle_error(err);
	// cli.exit(1);
});

process.on('SIGINT', function() {
	cli.exit();
});

if (args.task) {
	debug('running '+chalk.cyan(args.task));
	var task_data = tasklib.load_task_from_file(args.task)
	task_data.interval = undefined;
	task = tasklib.prepare_task(task_data);
	tasklib.run_task(task, function(err, result) {
		process.exit();
	});
} else {
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
}

