var path = require('path');
var chalk = require('chalk');

global.paths = {
	root: __dirname,
	lib: path.join(__dirname, 'lib'),
	blocks: path.join(__dirname, 'blocks')
};

require( path.join(global.paths.lib, 'log.js') ).init();

var db = require( path.join(global.paths.root, 'db.js') );
var server = require( path.join(global.paths.root, 'server.js') );
server.start();
var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );

/*
TODO:
	- versioning
		`npm version major|minor|patch [-m "commit message"]`

# 1.0
	- store tasks separately?
		- as hjson maybe?
	- blocks should be able to do logging themselves config: { log: false }
	- validation
	- different colors for different tasks
		- white, grey, black, blue, cyan, green, magenta, red, yellow
	- functional programming
		- https://www.npmjs.com/package/ramda
	- switch templating engine to `liquid`?
		- https://github.com/mattmccray/liquid.js
	- project logo
	- basic documentation
	- publish
		- blog post
	- write an example that uses node-red nodes

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


// var testtasks = [{
// 	"name": "counter",
// 	"interval": 'every 2 seconds',
// 	"steps": [
// 		{
// 			"id": "tick",
// 			"block": "tick",
// 			"flow": {
// 				"if": ["digest"]
// 			},
// 		},

// 		{
// 			"id": "digest",
// 			"block": "digest",
// 			"flow": {
// 				"if": ["console"]
// 			},
// 		},

// 		{
// 			"id": "console",
// 			"block": "log-console",
// 			"options": {
// 				"message": "<%=input%>"
// 			}
// 		},
// 	]
// }];

// var tasks = tasklib.load_tasks(testtasks);
var tasks = /*global.tasks =*/ tasklib.load_tasks(db.object.tasks);
tasklib.run_all(tasks);
