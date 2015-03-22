var _ = require('lodash');
var later = require('later');
var moment = require('moment');
var winston = require('winston');
var chalk = require('chalk');
var path = require('path');
var sf = require('sf');
var slug = require('slug');
var fs = require('fs');
var R = require('ramda');

var config = require( path.join(global.paths.root, 'config.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );
var filesystem = require( path.join(global.paths.lib, 'filesystem.js') );

var debug = require('debug')(path.basename(__filename));


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
	if (!flow['always'] || !_.isArray(flow['always'])) flow['always'] = [];
	return flow;
}


// TODO: rename to `sanitize`
function normalize(it, defaults) {
	return _.defaults({}, it || {}, defaults || {});
}


function save_task(task) {
	if (!task._file) {
		debug(sf('can\'t save task "{0}" — no file specified.', task.name));
		return;
	}
	fs.writeFileSync(task._file, JSON.stringify(make_savable(task), null, '\t'));
}
// save_task = _.throttle(save_task, 500);


function create_step(block, task, step) {
	step.flow = normalize_step_flow(step.flow);
	step.options = normalize(step.options, block.defaults.options);
	step.data = normalize(step.data, block.defaults.data);
	return R.curry(block.fn)(task, step);
}


function load_task_from_file(filepath) {
	var task_data = filesystem.load_json(filepath);
	task_data._file = filepath;
	return task_data;
}


function load_block(name) {
	return require(
		path.join(global.paths.blocks, name+'.js')
	);
}


function remove_task_by_index(index) {
	global.tasks.splice(index, 1);
}


function reload_task_by_index(index, from_file) {
	from_file = from_file || false;

	var task = global.tasks[index];
	var _file = task._file;

	var task_data;
	if (from_file) {
		task_data = load_task_from_file(_file);
	} else {
		task_data = make_savable(task);
		task_data._file = _file;
	}

	remove_task_by_index(index);
	task = add_task(task_data);
	return task;
}


function add_task(task_data) {
	var task = prepare_task(task_data);
	global.tasks.push(task);
	run_task(task);
	return task;
}


function prepare_task(_task) {
	var task = _.extend({}, _task);
	winston.info('loading task: ' + chalk.bgBlue(task.name));
	// debug('loading task: ' + chalk.bgBlue(task.name));

	if (!task.slug) task.slug = slug(task.name);

	task.steps.forEach(function(step) {
		var block = load_block(step.block);
		step._execute = create_step(block, task, step);
	});

	if (!!task.interval) {
		var schedule = later.parse.text(task.interval);

		if (schedule.error > -1) {
			throw new Error('invalid interval "'+task.interval+'".');
		}

		task = _.extend(task, {
			_schedule: schedule,
			_timer: later.setInterval(_.partial(run_task, task), schedule)
		});			
	}

	save_task(task);
	return task;
}


function prepare_tasks(tasks_array) {
	return tasks_array.map(prepare_task);
}


function run_task(task) {
	var tos = task.steps.reduce(function(result, step) {
		result = result.concat(step.flow['if']);
		result = result.concat(step.flow['else']);
		result = result.concat(step.flow['always']);
		return result;
	}, []);
	var root_steps = task.steps
		.filter(function(step) {
			return tos.indexOf(step.id) === -1;
		})
		.forEach(function(root_step) {
			root_step._execute(task, root_step);
		});
	return task;
}


function run_all(tasks) {
	tasks.forEach(run_task);
}


var flow_decision_defaults = {
	'if': true,
	'else': true,
	'always': true // always true
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
				child._execute(output, step);
			});
		} catch (e) {
			console.log(e.stack);
		}
	});
}


module.exports = {
	run_all: run_all,
	run_task: run_task,
	load_block: load_block,
	create_step: create_step,
	make_savable: make_savable,
	remove_task_by_index: remove_task_by_index,
	reload_task_by_index: reload_task_by_index,
	add_task: add_task,
	save_task: save_task,
	prepare_task: prepare_task,
	load_task_from_file: load_task_from_file,
	prepare_tasks: prepare_tasks,
	invoke_children: invoke_children,
	flow_decision: flow_decision,
	flow_decision_defaults: flow_decision_defaults,
	normalize_step_flow: normalize_step_flow,
	normalize: normalize
};
