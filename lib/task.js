var _ = require('lodash');
var later = require('later');
var moment = require('moment');
var winston = require('winston');
var path = require('path');
// var uuid = require('node-uuid');

var db = require( path.join(global.paths.root, 'db.js') );
var config = require( path.join(global.paths.root, 'config.js') );


function savable(task) {
	// don't persist anything prefixed with '_'
	return _.omit(task, function(value, key, object) {
		return (key[0] === '_');
	});
}


function create_task(module_name, options, interval, replace_existing) {
	replace_existing = replace_existing || false;

	// load module
	var p = path.join(global.paths.modules, module_name+'.js');
	var module = require(p);

	options = _.extend(options, {
		module: module_name
	});
	var run_function = module(options);
	var schedule = later.parse.text(interval);

	var task = _.extend(options, {
		// id: uuid.v1(),
		interval: interval,
		data: {},
		_run: run_function,
		_schedule: schedule,
		_timer: later.setInterval(run_function, schedule)
	});

	var results = db('tasks').get_all_by_name(task.name);
	if (results.length > 0) {
		// task already exists in db
		if (replace_existing) {
			// winston.debug('replacing existing task');
			var existing_task = results[0];
			existing_task = task;
		} else {
			var message = 'task with that name already exists in db: ' + task.name;
			helper.handle_error(message);
			throw message

			// TODO: add one with same name?
			// db('tasks').push( savable(task) );
		}
	} else {
		db('tasks').push( savable(task) );
	}
	db.saveSync();

	return task;
}


module.exports = {
	create_task: create_task
};
