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
	- versioning
		`npm version major|minor|patch [-m "commit message"]`

# 1.0
	- twitter stream doesn't have an interval — how to handle blocks like that?
	- blocks should be able to do logging themselves config: { log: false }
	- different colors for different tasks
		- white, grey, black, blue, cyan, green, magenta, red, yellow 
	- functional programming
		- https://www.npmjs.com/package/ramda
	- write tests
	- store tasks separately?
		- as hjson maybe?
	- switch templating engine to `liquid`?
		- https://github.com/mattmccray/liquid.js
	- write an example that uses node-red nodes
	- project logo
	- publish
		- blog post

# 2.0
	- web frontend
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
	// email.send('causality: '+err.name, err.stack);

	exit(1);
});


process.on('SIGINT', function() {
	exit();
});


var tasks = /*global.tasks =*/ tasklib.load_tasks(db.object.tasks);
tasklib.run_all(tasks);
