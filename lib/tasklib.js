var _ = require('lodash');
var later = require('later');
var moment = require('moment');
var winston = require('winston');
var chalk = require('chalk');
var path = require('path');
// var uuid = require('node-uuid');

var db = require( path.join(global.paths.root, 'db.js') );
var config = require( path.join(global.paths.root, 'config.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );


function make_savable(task) {
	// don't persist anything prefixed with '_'
	return _.omit(task, function(value, key, object) {
		return (key[0] === '_');
	});
}


function normalize_step_flow(flow) {
	flow = flow || {};
	if (!_.isObject(flow)) flow = {};
	if (!flow['if'] || !_.isArray(flow['if'])) flow['if'] = [];
	if (!flow['else'] || !_.isArray(flow['else'])) flow['else'] = [];
	if (!flow['anyway'] || !_.isArray(flow['anyway'])) flow['anyway'] = [];
	return flow;
}


function normalize_step_data(step, defaults) {
	defaults = defaults || {};
	var data = step.data || {};
	return _.defaults({}, step.data, defaults);
}


function normalize_step_options(step, defaults) {
	defaults = defaults || {};
	var options = step.options || {};
	return _.defaults({}, step.options, defaults);
}


function load_task(_task) {
	var task = _.extend({}, _task);
	winston.info('loading task: ' + chalk.bgBlue(task.name));

	task.steps.forEach(function(step) {
		step.flow = normalize_step_flow(step.flow);

		var block = require( path.join(global.paths.blocks, step.block+'.js') );
		step._execute = block.create(task, step);
	});

	if (!!task.interval) {
		var schedule = later.parse.text(task.interval);

		if (schedule.error > -1) {
			throw 'invalid interval "'+task.interval+'".';
		}

		task = _.extend(task, {
			_schedule: schedule,
			_timer: later.setInterval(_.partial(run_task, task), schedule)
		});			
	}

	return task;
}


function load_tasks(tasks_array) {
	return tasks_array.map(load_task);
}


function run_task(task) {
	var tos = task.steps.reduce(function(result, step) {
		result = result.concat(step.flow['if']);
		result = result.concat(step.flow['else']);
		result = result.concat(step.flow['anyway']);
		return result;
	}, []);
	var root_steps = task.steps
		.filter(function(step) {
			return tos.indexOf(step.id) === -1;
		})
		.forEach(function(root_step) {
			root_step._execute();
		});
}


function run_all(tasks) {
	tasks.forEach(run_task);	
}


var flow_decision_defaults = {
	'if': true,
	'else': true,
	'anyway': true // always true
};
function flow_decision(test) {
	return _.extend({}, flow_decision_defaults, {
		'if': test,
		'else': !test
	});
}


function invoke_children(step, task, output, flow_decision) {
	_.keys(flow_decision).forEach(function(key) {
		try {
			if (!flow_decision[key]) return;

			var child_ids = step.flow[key];
			var children = child_ids.map(function(id) {
				return helper.get_by(task.steps, 'id', id)[0];
			});
			children.forEach(function(child) {
				child._execute(output, step, output);
			});
		} catch (e) {
			console.log(e.stack);
		}
	});
}


module.exports = {
	run_all: run_all,
	make_savable: make_savable,
	load_task: load_task,
	load_tasks: load_tasks,
	invoke_children: invoke_children,
	flow_decision: flow_decision,
	flow_decision_defaults: flow_decision_defaults,
	normalize_step_flow: normalize_step_flow,
	normalize_step_options: normalize_step_options,
	normalize_step_data: normalize_step_data,
};
