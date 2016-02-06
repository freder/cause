'use strict';

const glob = require('glob');
const R = require('ramda');
const shortid = require('shortid');

const common = require('./common.js');


var _ = require('lodash');
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


const loadBlock = module.exports.loadBlock =
function loadBlock(blocksDirPath, packageName) {
	let block;
	// loads a block by package name.
	// it tries the following things in that order:
	// - see if there is a local npm module directory in the blocks dir
	// - check if there is a local js file (private ones, or for testing stuff),
	// - otherwise load the (npm-)installed module
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

	return _.merge(
		{},
		block,
		{ defaults: block.defaults || {} }
	);
};


const prepareStep = module.exports.prepareStep =
function prepareStep(taskData, _step) {
	if (!_step.block) {
		throw new Error('step needs to have block');
	}

	let step = _.extend({}, _step);
	step.id = step.id || shortid.generate();

	step = _.defaults(step, {
		flow: {},
		options: {}
	});

	const block = loadBlock(blocksDirPath, step.block);
	step._execute = create_execute_function(block, taskData, step); // TODO

	return step;
};


const prepareTask = module.exports.prepareTask =
function prepareTask(_task) {
	// tasks need a name
	if (!_task.name) {
		throw new Error('task needs to have a name');
	}

	let task = _.merge({}, _task);
	debug('loading task: ' + formattingUtils.cli_msg(task.name));

	// set defaults
	task = _.defaults(task, {
			steps: [],
			data: {},
			slug: slugify(task.name)
		}
	);
	task.data.counter = task.data.counter || 0;

	task.steps = (task.steps || [])
		.map((step) => {
			return prepareStep(task, step);
		});

	return task;
};


const startTask = module.exports.startTask =
function startTask(_task) {
	let task = _.merge({}, _task);

	if (!task.interval) {
		// task takes care of it itself
	} else {
		const schedule = later.parse.text(task.interval);
		if (schedule.error > -1) {
			throw new Error(`invalid interval ${task.interval}.`);
		}

		task._schedule = schedule;
		task._timer = later.setInterval(
			R.partial(runTask, [task]),
			schedule
		);
	}

	return task;
};


const loadTaskFromFile = module.exports.loadTaskFromFile =
function loadTaskFromFile(taskFileAbsPath, cb) {
	fs.readFile(taskFileAbsPath, (err, data) => {
		if (err) {
			return cb(err, null);
		}
		cb(null, common.parseJSON(data.toString()));
	});
};


const getTaskFiles = module.exports.getTaskFiles =
function getTaskFiles(tasksDirAbsPath) {
	const pattern = path.join(tasksDirAbsPath, '*.json');
	const taskFiles = glob.sync(pattern);
	return taskFiles;
};


const findRootSteps = module.exports.findRootSteps =
function findRootSteps(task) {
	// get all steps that are children
	const childSteps = task.steps
		.reduce(function(result, step) {
			result = result.concat(step.flow['if']);
			result = result.concat(step.flow['else']);
			result = result.concat(step.flow['always']);
			return result;
		}, []);

	// of all steps, find those that are not children
	const rootSteps = task.steps
		.filter(function(step) {
			return childSteps.indexOf(step.id) === -1;
		});
	return rootSteps;
};


const startTasks = module.exports.startTasks =
function startTasks(tasksData) {
	return tasksData
		.map(prepareTask)
		// .map(saveTask)
		.map(startTask)
		.map((task) => {
			console.log(task.name);
			return task;
		});
};


const startsWithUnderscore = module.exports.startsWithUnderscore =
function startsWithUnderscore(str) {
	return (str[0] === '_');
};


const keyDoesNotStartWithUnderscore = module.exports.keyDoesNotStartWithUnderscore =
function keyDoesNotStartWithUnderscore(val, key) {
	return !startsWithUnderscore(key);
};


// takes a task and prepares it for saving to file
const makeSavable = module.exports.makeSavable =
function makeSavable(task, skipSteps) {
	// don't persist anything prefixed with '_'
	let savableTask = R.pickBy(keyDoesNotStartWithUnderscore, task);

	// optionally also for steps
	if (!skipSteps) {
		savableTask.steps = savableTask.steps
			.map(function(step) {
				let savableStep = R.pickBy(keyDoesNotStartWithUnderscore, step);
				savableStep.flow = R.reject(_.isEmpty, savableStep.flow);
				savableStep = R.reject(_.isEmpty, savableStep);
				return savableStep;
			});
	}

	return savableTask;
};


const prepareFlow = module.exports.prepareFlow =
function prepareFlow(flow) {
	if (!_.isObject(flow)) {
		flow = {};
	}

	['if', 'else', 'always']
		.forEach(function(key) {
			if (!flow[key] || !_.isArray(flow[key])) {
				flow[key] = [];
			}
		});

	return flow;
};


const runTask = module.exports.runTask =
function runTask(task) {
	task._currentlyExecutingSteps = {};

	debug_event(
		formattingUtils.cli_msg(task.name, chalk.bgWhite.blue('START'))
	);

	const defaultDoneCallback = function() {
		debug_event(
			formattingUtils.cli_msg(task.name, chalk.bgWhite.blue('END'))
		);
	};

	if (!_.isFunction(task._doneCallback)) {
		task._doneCallback = function() {};
	}
	task._doneCallback = R.wrap(
		task._doneCallback,
		(doneCallback) => {
			doneCallback();
			defaultDoneCallback();
		}
	);

	// keep track of how often task was run
	task.data.counter++;

	// execute each entry point step
	const input = null;
	findRootSteps(task)
		.forEach(function(rootStep) {
			rootStep._execute(input, rootStep);
		});
	return task;
};











const _prepare = module.exports._prepare =
function _prepare(it, defaults) {
	return _.defaults({}, it || {}, defaults || {});
};


const save_task = module.exports.save_task =
function save_task(task) {
	if (!task._file) {
		debug(sf('can\'t save task "{0}" — no file specified.', task.name));
		return;
	}
	debug(sf('saving task "{0}" to "{1}"', task.name, path.relative(cwd, task._file)));
	fs.writeFileSync(task._file, JSON.stringify(makeSavable(task), null, '\t'));
};


const step_description = module.exports.step_description =
function step_description(step, block) {
	var template;
	if (block.defaults.description) { template = block.defaults.description; }
	if (step.description) { template = step.description; }
	if (template) {
		return _.template(template)(step);
	} else {
		return step.id;
	}
};


const create_execute_function = module.exports.create_execute_function =
function create_execute_function(block, task, step) {
	step.flow = prepareFlow(step.flow);
	step.options = _prepare(step.options, block.defaults.options);
	step.data = _prepare(step.data, block.defaults.data);
	step._description = step_description(step, block);

	return function(input, prev_step, cb) {
		if (task._currentlyExecutingSteps) {
			task._currentlyExecutingSteps[step.id] = moment();
		}

		var done = function(err, output, decision) {
			if (err) {
				return common.printStacktrace(err);
			}

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
					if (err) {
						common.printStacktrace(err);
					}
					// ... does nothing
				};
			}
			cb(err, output);
		};

		var context = createContext(input, step, prev_step, task, block);
		block.fn.call(null, input, step, context, done);
	};
};


const createContext = module.exports.createContext =
function createContext(input, step, prevStep, task, block) {
	return {
		save: () => { save_task(task); },
		debug: require('debug')('cause:block:'+block.name),

		input: input,
		step: step,
		prevStep: prevStep,
		task: task,
		config: config,
		logger: {
			log: winston.log,
			info: winston.info,
			warn: winston.warn,
			error: winston.error
		}
	};
};


const remove_task_by_index = module.exports.remove_task_by_index =
function remove_task_by_index(index) {
	global.tasks.splice(index, 1);
};


// const reload_task_by_index = module.exports.reload_task_by_index =
// function reload_task_by_index(index, from_file) {
// 	from_file = from_file || false;

// 	var task = global.tasks[index];
// 	var _file = task._file;

// 	var task_data;
// 	if (from_file) {
// 		task_data = loadTaskFromFile(_file);
// 	} else {
// 		task_data = makeSavable(task);
// 		task_data._file = _file;
// 	}

// 	remove_task_by_index(index);
// 	task = add_task(task_data);
// 	return task;
// };


// const add_task = module.exports.add_task =
// function add_task(task_data) {
// 	var task = prepareTask(task_data);
// 	global.tasks.push(task);
// 	runTask(task);
// 	return task;
// };



const saveTask = module.exports.saveTask =
function saveTask(task) {
	// TODO: ??

	return task;
};


const check_if_done = module.exports.check_if_done =
function check_if_done(task, step) {
	if (task._currentlyExecutingSteps) {
		delete task._currentlyExecutingSteps[step.id];

		// last step has finished executing
		if (R.keys(task._currentlyExecutingSteps).length === 0) {
			if (task._doneCallback) {
				task._doneCallback();
			}
		}
	}
};


const invoke_children = module.exports.invoke_children =
function invoke_children(step, task, output, flowDecision) {
	var input = output;
	R.keys(flowDecision) // if, else, always
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
};
