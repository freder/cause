var fmt = require('simple-fmt');
var winston = require('winston');
var chalk = require('chalk');
var path = require('path');
var _ = require('lodash');

var helper = require( path.join(global.paths.lib, 'helper.js') );


// console.log( helper.format('{} EUR', '123') );
// console.log( helper.format('{price} EUR', { price: '123' }) );


function create(task, step) {
	return function(input, previous_step) {
		// sanity check
		var config = step.config || {};
		config = _.defaults(config, {
			title: step.name,
			message: '{}'
		});

		// do the work
		var title = helper.format(config.title, input);
		var message = helper.format(config.message, input);
		var line = fmt(
			'{0} {1} {2}: {3}',
			chalk.bgBlue(task.name),
			chalk.blue(previous_step.module),
			chalk.white(title),
			chalk.green(message)
		);
		winston.info(line);

		// pass through
		var output = input;

		// invoke children
		var children = helper.get_children(step, task); // TODO: DRY
		children.forEach(function(child) {
			child.execute(output, step);
		});
	};
}


module.exports = {
	create: create
};
