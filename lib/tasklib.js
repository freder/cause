'use strict';

var _ = require('lodash');
var R = require('ramda');
var later = require('later');
var moment = require('moment');
var winston = require('winston');
var chalk = require('chalk');
var path = require('path');
var sf = require('sf');
var slugify = require('mout/string/slugify');
var fs = require('fs');

var cwd = process.cwd();
var config = require(path.join(cwd, 'config.js'));
var libPath = path.join(cwd, config.paths.lib);

var utils = require(path.join(libPath, 'utils.js'));
var taskUtils = require('cause-utils/task');
var formattingUtils = require('cause-utils/formatting');

var debug = require('debug')('cause:lib:'+path.basename(__filename));
var debug_event = require('debug')('cause:event');


const blocksDirPath = path.resolve(cwd, config.paths.blocks);


// TODO: DRY
function handle_error(err) {
	winston.error(err.stack);
}


// takes a task and prepares it for saving to file
function make_savable(task, skip_steps) {
	// don't persist anything prefixed with '_'
	function doesNotStartWithUnderscore(val, key) {
		return (key[0] !== '_');
	}

	var savable = R.pickBy(doesNotStartWithUnderscore, task);

	// optionally also for steps
	if (!skip_steps) {
		savable.steps = savable.steps.map(function(step) {
			var savable_step = R.pickBy(doesNotStartWithUnderscore, step);

			savable_step.flow = _.omit(savable_step.flow, _.isEmpty);
			savable_step = _.omit(savable_step, _.isEmpty);

			return savable_step;
		});
	}

	return savable;
}


function prepare_flow(flow) {
	flow = flow || {};
	if (!_.isObject(flow)) { flow = {}; }
	['if', 'else', 'always'].forEach(
		function(key) {
			if (!flow[key] ||
				!_.isArray(flow[key])) { flow[key] = []; }
		}
	);
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
	debug(sf('saving task "{0}" to "{1}"', task.name, path.relative(cwd, task._file)));
	fs.writeFileSync(task._file, JSON.stringify(make_savable(task), null, '\t'));
}


function step_description(step, block) {
	var template;
	if (block.defaults.description) { template = block.defaults.description; }
	if (step.description) { template = step.description; }
	if (template) {
		return _.template(template)(step);
	} else {
		return step.id;
	}
}


function create_execute_function(block, task, step) {
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
			if (err) { return handle_error(err); }

			// based on this, it is decided on which of the
			// block's three outlets (`if`, `else`, `always`)
			// the flow continues.
			decision = taskUtils.flowDecision(decision);

			// invoke child steps
			invoke_children(step, task, output, decision);

			// must run AFTER `invoke_children`
			check_if_done(task, step);
			// TODO: maybe run this only after step callback has finished?

			// default callback
			if (!_.isFunction(cb)) {
				cb = function(err, output, decision) {
					// ... does nothing
				};
			}
			cb(err, output);
		};

		var context = createContext(input, step, prev_step, task, block);
		block.fn.call(null, input, step, context, done);
	};
}


function createContext(input, step, prev_step, task, block) {
	return {
		save: function() { save_task(task); },
		debug: require('debug')('cause:block:'+block.name),

		input: input,
		step: step,
		prevStep: prev_step,
		task: task,
		config: config,
		logger: {
			log: winston.log,
			info: winston.info,
			warn: winston.warn,
			error: winston.error
		}
	};
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
		task_data = loadTaskFromFile(_file);
	} else {
		task_data = make_savable(task);
		task_data._file = _file;
	}

	remove_task_by_index(index);
	task = add_task(task_data);
	return task;
}


function add_task(task_data) {
	var task = prepareTask(task_data);
	global.tasks.push(task);
	run_task(task);
	return task;
}


function loadBlock(blocksDirPath, packageName) {
	// loads a block by package name.
	// it tries the following things in that order:
	// - see if there is a local npm module directory in the blocks dir
	// - check if there is a local js file (private ones, or for testing stuff),
	// - otherwise load the (npm-)installed module
	let block;
	const packagePath = path.join(blocksDirPath, packageName/*, packageMetadata.main*/);
	const packageDotJsonPath = path.join(packagePath, 'package.json');
	const localFilePath = path.join(blocksDirPath, `${packageName}.js`);

	// if there is a local dir with a package.json file
	if (fs.existsSync(packageDotJsonPath)) {
		// const packageMetadata = require(packageDotJsonPath); // you can require a JSON file
		// debug('local package ' + packagePath);
		block = require(packagePath);
	} else if (fs.existsSync(localFilePath)) {
		block = require(localFilePath);
	} else {
		block = require(packageName);
	}

	return {
		block,
		blockName: block.name || packageName
	};
}


function prepareStep(_step) {
	let step = _.extend({}, _step);

	if (!step.block) {
		throw new Error('task step needs to have block');
	}

	// const {block, blockName} = loadBlock(blocksDirPath, step.block);
	const result = loadBlock(blocksDirPath, step.block);
	const block = result.block;
	const blockName = result.blockName;
	step._execute = create_execute_function(block, task, step);
}


function prepareTask(_task) {
	let task = _.extend({}, _task);
	debug('loading task: ' + formattingUtils.cli_msg(task.name));

	// tasks need a name
	if (!task.name) {
		throw new Error('task needs to have a name');
	}

	// set defaults
	task = _.defaults(task, {
			steps: [],
			data: {},
			slug: slugify(task.name)
		}
	);

	if (!task.data.counter) {
		task.data.counter = 0;
	}

	task.steps = task.steps.map(prepareStep);

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


function prepareTasks(tasks_array) {
	return tasks_array.map(prepareTask);
}


const loadTaskFromFile = module.exports.loadTaskFromFile =
function loadTaskFromFile(absPath, cb) {
	fs.readFile(absPath, (err, data) => {
		if (err) {
			return cb(err, null);
		}
		cb(null, parseJSON(data.toString()));
	});
}


function findRootSteps(task) {
	// get all blocks that are children
	var tos = task.steps.reduce(function(result, step) {
		result = result.concat(step.flow['if']);
		result = result.concat(step.flow['else']);
		result = result.concat(step.flow['always']);
		return result;
	}, []);
	// of all steps, find those that are not children
	var root_steps = task.steps
		.filter(function(step) {
			return tos.indexOf(step.id) === -1;
		});
	return root_steps;
}


function run_task(task) {
	task._currently_executing_steps = {};
	task._start_time = moment();
	debug_event( formattingUtils.cli_msg(task.name, chalk.bgWhite.blue('START')) );
	var default_done = function() {
		debug_event( formattingUtils.cli_msg(task.name, chalk.bgWhite.blue('END')) );
	};
	if (!_.isFunction(task._done)) {
		task._done = function() {};
	}
	task._done = _.wrap(task._done, function(done) {
		done();
		default_done();
	});

	task.data.counter++;

	findRootSteps(task)
		.forEach(function(root_step) {
			root_step._execute(null, root_step);
		});
	return task;
}


function check_if_done(task, step) {
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
			if (_.isFunction(task._done)) { task._done(); }
		}
	}
}


function run_all(tasks) {
	tasks.forEach(run_task);
}


function invoke_children(step, task, output, flowDecision) {
	var input = output;
	_.keys(flowDecision) // if, else, always
		.forEach(function(key) {
			if (!flowDecision[key]) { return; }
			try {
				step.flow[key] // children ids
					.forEach(function(id) {
						var child_step = utils.misc.get_first_by(task.steps, 'id', id);
						child_step._execute(input, step);
					});
			} catch (e) {
				console.log(e.stack);
			}
		});
}


module.exports = {
	run_all: run_all,
	run_task: run_task,
	loadBlock: loadBlock,
	create_execute_function: create_execute_function,
	make_savable: make_savable,
	remove_task_by_index: remove_task_by_index,
	reload_task_by_index: reload_task_by_index,
	add_task: add_task,
	save_task: save_task,
	prepareTask: prepareTask,
	loadTaskFromFile: loadTaskFromFile,
	prepareTasks: prepareTasks,
	findRootSteps: findRootSteps,
	invoke_children: invoke_children,
	prepare_flow: prepare_flow,
	_prepare: _prepare
};
