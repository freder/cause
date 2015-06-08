var _ = require('lodash');
var later = require('later');
var moment = require('moment');
var winston = require('winston');
var chalk = require('chalk');
var path = require('path');
var sf = require('sf');
var slug = require('slug');
var fs = require('fs');

var config = require( path.join(global.paths.root, 'config.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );
var filesystem = require( path.join(global.paths.lib, 'filesystem.js') );

var debug = require('debug')('cause:lib:'+path.basename(__filename));
var debug_event = require('debug')('cause:event');


// takes a task and prepares it for saving to file
function make_savable(task, skip_steps) {
	// don't persist anything prefixed with '_'
	function beginsWithUnderscore(value, key, object) {
		return (key[0] === '_');
	}

	var savable = _.omit(task, beginsWithUnderscore);
	savable = _.omit(savable, _.isEmpty);

	// optionally also for steps
	if (!skip_steps) {
		savable.steps = savable.steps.map(function(step) {
			var savable_step = _.omit(step, beginsWithUnderscore);

			savable_step.flow = _.omit(savable_step.flow, _.isEmpty);
			savable_step = _.omit(savable_step, _.isEmpty);

			return savable_step;
		});
	}

	return savable;
}


function prepare_flow(flow) {
	flow = flow || {};
	if (!_.isObject(flow)) flow = {};
	if (!flow['if'] || !_.isArray(flow['if'])) flow['if'] = [];
	if (!flow['else'] || !_.isArray(flow['else'])) flow['else'] = [];
	if (!flow['always'] || !_.isArray(flow['always'])) flow['always'] = [];
	return flow;
}


function _prepare(it, defaults) {
	return _.defaults({}, it || {}, defaults || {});
}


function save_task(task) {
	if (!task._file) {
		debug(sf('can\'t save task "{0}" — no file specified.', task.name));
		return;
	}
	debug(sf('saving task "{0}" to "{1}"', task.name, path.relative(global.paths.root, task._file)));
	fs.writeFileSync(task._file, JSON.stringify(make_savable(task), null, '\t'));
}


function step_description(step, block) {
	var template;
	if (block.defaults.description) template = block.defaults.description;
	if (step.description) template = step.description;
	if (template) {
		return _.template(template)(step);
	} else {
		return step.id;
	}
}


function create_step_function(block, task, step) {
	step = _.defaults(step, {
		flow: {},
		options: {}
	});
	// if (!step.id) throw new Error('step needs an id');
	step.id = step.id || ''+Math.round(Math.random()*1000000);

	block = _.defaults(block, {
		defaults: {}
	});

	step.flow = prepare_flow(step.flow);
	step.options = _prepare(step.options, block.defaults.options);
	step.data = _prepare(step.data, block.defaults.data);
	step._description = step_description(step, block);

	return function(input, prev_step, cb) {
		if (task._currently_executing_steps) {
			task._currently_executing_steps[step.id] = moment();			
		}

		var done = function(err, output, decision) {
			// based on this, it is decided on which of the
			// block's three outlets (`if`, `else`, `always`)
			// the flow continues.
			if (typeof decision == 'boolean') {
				decision = flow_decision(decision);
			} else if (_.isObject(decision)) {
				decision = _.defaults(decision, flow_decision_defaults);
			} else if (decision === null) {
				decision = _.defaults({}, flow_decision_defaults, {
					'if': false,
					'else': false
				});
			} else {
				throw new Error('decision expected');
			}

			// invoke child steps
			invoke_children(step, task, output, decision);

			// default callback
			if (!_.isFunction(cb)) {
				cb = function(err, output, decision) {
					// ... does nothing
				}
			}
			cb(err, output);
		}

		block.fn(task, step, input, prev_step, done);
	}
}


function load_task_from_file(filepath) {
	var task_data = filesystem.load_json(filepath);
	task_data._file = filepath;
	return task_data;
}


function load_block(name) {
	// check if there is a local file with that name first,
	// otherwise load the installed module.
	var local_path = path.join(global.paths.blocks, name+'.js');
	var block = (fs.existsSync(local_path))
		? require(local_path)
		: require(name);
	return block;
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
	debug('loading task: ' + helper.format_msg(task.name));

	if (!task.name) throw new Error('task has no name');
	task = _.defaults(task, {
		steps: [],
		data: {},
		slug: slug(task.name)
	})
	if (!task.data.counter) task.data.counter = 0;

	task.steps.forEach(function(step) {
		var block = load_block(step.block);
		step._execute = create_step_function(block, task, step);
	});

	if (!!task.interval) {
		var schedule = later.parse.text(task.interval);

		if (schedule.error > -1) {
			throw new Error('invalid interval "'+task.interval+'".');
		}

		task = _.extend(task, {
			_schedule: schedule,
			_timer: later.setInterval(_.partial(run_task, task), schedule),
		});
	}

	save_task(task);
	return task;
}


function prepare_tasks(tasks_array) {
	return tasks_array.map(prepare_task);
}


function run_task(task) {
	task._currently_executing_steps = {};
	task._start_time = moment();
	debug_event( helper.format_msg(task.name, chalk.bgWhite.blue('START')) );
	task._done = task._done || function() {
		debug_event( helper.format_msg(task.name, chalk.bgWhite.blue('END')) );
	};

	task.data.counter++;
	
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
	var input = output;
	_.keys(flow_decision)
		.forEach(function(key) {
			if (!flow_decision[key]) return;
			try {
				step.flow[key] // children ids
					.forEach(function(id) {
						var child_step = helper.get_first_by(task.steps, 'id', id);
						child_step._execute(input, step);
					});
			} catch (e) {
				console.log(e.stack);
			}
		});

	// assuming that every step calls `invoke_children()` in the end ...
	if (task._currently_executing_steps) {
		delete task._currently_executing_steps[step.id];
		
		// last step has finished executing
		if (_.keys(task._currently_executing_steps).length === 0) {
			var duration = moment() - task._start_time;
			delete task._start_time;
			// debug(
			// 	sf('{0} finished after {1} s', task.name, (duration / 1000.0).toFixed(1))
			// );

			// callback
			if (_.isFunction(task._done)) task._done();
		}		
	}
}


module.exports = {
	run_all: run_all,
	run_task: run_task,
	load_block: load_block,
	create_step_function: create_step_function,
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
	prepare_flow: prepare_flow,
	_prepare: _prepare
};
