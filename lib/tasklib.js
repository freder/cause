'use strict';

const glob = require('glob');
const R = require('ramda');
const shortid = require('shortid');
const _ = require('lodash');
const later = require('later');
const winston = require('winston');
const chalk = require('chalk');
const path = require('path');
const slugify = require('mout/string/slugify');
const fs = require('fs');

const debugTask = require('debug')('cause:task');
const debugEvent = require('debug')('cause:event');

const config = require('../config.js');
const common = require('./common.js');

const taskUtils = require('cause-utils/task');
const formattingUtils = require('cause-utils/formatting');


const blocksDirPath = path.resolve(config.paths.blocks);


const loadBlock = module.exports.loadBlock =
function loadBlock(blocksDirPath, packageName) {
	let block;
	// loads a block by package name.
	// it tries the following things in that order:
	// - see if there is a local npm module directory in the blocks dir
	// - check if there is a local js file (private ones, or for testing stuff),
	// - otherwise load the (npm-)installed module
	const packagePath = path.join(blocksDirPath, packageName);
	const packageDotJsonPath = path.join(packagePath, 'package.json');
	const localFilePath = path.join(blocksDirPath, `${packageName}.js`);

	// if there is a local dir with a package.json file
	if (fs.existsSync(packageDotJsonPath)) {
		// debugTask('local package ' + packagePath);
		block = require(packagePath);
	} else if (fs.existsSync(localFilePath)) {
		block = require(localFilePath);
	} else {
		block = require(packageName);
	}

	block.defaults = block.defaults || {};
	return block;
};


const prepareStep = module.exports.prepareStep =
function prepareStep(task, _step) {
	if (!_step.block) {
		throw new Error('step needs to have block');
	}

	let step = _.merge({}, _step);

	const block = loadBlock(blocksDirPath, step.block);

	step.id = step.id || shortid.generate();
	step.flow = prepareFlow(step.flow);
	step.options = addDefaults(step.options, block.defaults.options);
	step.data = addDefaults(step.data, block.defaults.data);
	// step._description = step_description(step, block);

	step._execute = createExecuteFunction(block, task, step);

	return step;
};


const prepareTask = module.exports.prepareTask =
function prepareTask(_task) {
	// tasks need a name
	if (!_task.name) {
		throw new Error('task needs to have a name');
	}

	let task = _.merge({}, _task);
	debugTask('loading task: ' + formattingUtils.cliMsg(task.name));

	// set defaults
	task = _.defaults(task, {
			steps: [],
			data: {},
			slug: slugify(task.name)
		}
	);
	task.data.counter = task.data.counter || 0;
	task._currentlyExecutingSteps = {};

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

	return runTask(task);
};


const loadTaskFromFile = module.exports.loadTaskFromFile =
function loadTaskFromFile(taskFileAbsPath, cb) {
	fs.readFile(taskFileAbsPath, (err, data) => {
		if (err) {
			return cb(err, null);
		}
		let taskData = common.parseJSON(data.toString());
		taskData._filePath = taskFileAbsPath;
		cb(null, taskData);
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
		/*.map((task) => {
			console.log(task.name);
			return task;
		})*/;
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


// TODO: test
const runTask = module.exports.runTask =
function runTask(task) {
	debugEvent(
		formattingUtils.cliMsg(task.name, chalk.bgWhite.blue('START'))
	);

	const defaultDoneCallback = function() {
		debugEvent(
			formattingUtils.cliMsg(task.name, chalk.bgWhite.blue('END'))
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
			try {
				rootStep._execute(input, rootStep);
			} catch (e) {
				common.printStacktrace(e);
			}
		});
	return task;
};


const addDefaults = module.exports.addDefaults = _.defaults;


const isTaskDone = module.exports.isTaskDone =
function isTaskDone(task) {
	if (!task._currentlyExecutingSteps) {
		return true;
	} else if (R.keys(task._currentlyExecutingSteps).length === 0) {
		return true;
	} else {
		return false;
	}
};


// TODO: test
const createExecuteFunction = module.exports.createExecuteFunction =
function createExecuteFunction(block, task, step) {
	return function(input, prevStep, cb) {
		task._currentlyExecutingSteps[step.id] = true;

		const done = function(err, output, decision) {
			if (err) {
				return common.printStacktrace(err);
			}

			// based on this, it is decided on which of the
			// block's three outlets (`if`, `else`, `always`)
			// the flow continues.
			decision = taskUtils.flowDecision(decision);

			// invoke child steps
			invokeChildren(step, task.steps, output, decision);

			// must run AFTER `invokeChildren`
			delete task._currentlyExecutingSteps[step.id];
			if (isTaskDone(task)) { // last step has finished executing
				if (task._doneCallback) {
					task._doneCallback();
				}
			}
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

		const context = createContext(input, step, prevStep, task, block);
		block.fn.call(null, input, step, context, done);
	};
};


const saveTaskToFile = module.exports.saveTaskToFile =
function saveTaskToFile(task, filePath) {
	const savableTask = makeSavable(task);
	fs.writeFileSync(
		filePath,
		JSON.stringify(savableTask, null, '\t')
	);
};


const saveTask = module.exports.saveTask =
function saveTask(task) {
	if (!task._filePath) {
		debugTask(`can't save task "${task.name}" — no file specified.`);
		return;
	}
	debugTask(`saving task "${task.name}" to "${path.relative('.', task._filePath)}"`);
	saveTaskToFile(task, task._filePath);
	return task;
};


// TODO: test
const createContext = module.exports.createContext =
function createContext(input, step, prevStep, task, block) {
	return {
		input, step, prevStep, task, config,
		save: () => {
			saveTask(task);
		},
		debug: require('debug')('cause:block:'+step.block),
		logger: {
			log: winston.log,
			info: winston.info,
			warn: winston.warn,
			error: winston.error
		},
		format: formattingUtils // should this be here?
		// TODO: maybe blocks should provide their own formatting
		// function for their output
	};
};


// TODO: test
const invokeChildren = module.exports.invokeChildren =
function invokeChildren(currentStep, taskSteps, output, flowDecision) {
	const input = output; // current step's output is next step's input
	R.keys(flowDecision) // { if, else, always }
		.forEach(function(key) {
			if (!flowDecision[key]) { return; }
			try {
				currentStep.flow[key] // children ids
					.forEach(function(id) {
						const childStep = common.getItemById(taskSteps, id);
						childStep._execute(input, currentStep);
					});
			} catch (e) {
				common.printStacktrace(e);
			}
		});
};










// const step_description = module.exports.step_description =
// function step_description(step, block) {
// 	var template;
// 	if (block.defaults.description) { template = block.defaults.description; }
// 	if (step.description) { template = step.description; }
// 	if (template) {
// 		return _.template(template)(step);
// 	} else {
// 		return step.id;
// 	}
// };


// const remove_task_by_index = module.exports.remove_task_by_index =
// function remove_task_by_index(index) {
// 	global.tasks.splice(index, 1);
// };


// const reload_task_by_index = module.exports.reload_task_by_index =
// function reload_task_by_index(index, from_file) {
// 	from_file = from_file || false;

// 	var task = global.tasks[index];
// 	var _filePath = task._filePath;

// 	var task_data;
// 	if (from_file) {
// 		task_data = loadTaskFromFile(_filePath);
// 	} else {
// 		task_data = makeSavable(task);
// 		task_data._filePath = _filePath;
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
