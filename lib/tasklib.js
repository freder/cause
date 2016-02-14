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

const debug = require('debug');
const debugTask = debug('cause:task');
const debugEvent = debug('cause:event');

const config = require('../config.js');
const common = require('./common.js');

const formattingUtils = require('cause-utils/formatting');


const blocksDirPath = path.resolve(config.paths.blocks);

const noop = () => {};


const loadBlock = module.exports.loadBlock =
function loadBlock(blocksDirPath, packageName) {
	debugTask(`loading block: ${packageName}`);

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
	debugEvent(`loading ${formattingUtils.cliMsg(task.name)}`);

	// set defaults
	task = _.defaults(task, {
			steps: [],
			data: {},
			slug: slugify(task.name)
		}
	);
	task._currentlyExecutingSteps = {};
	task.data.counter = task.data.counter || 0;

	if (task.interval) {
		const schedule = later.parse.text(task.interval);
		if (schedule.error > -1) {
			throw new Error(`invalid interval ${task.interval}.`);
		}
		task._schedule = schedule;
	} else {
		// task takes care of it itself
	}

	task.steps = (task.steps || [])
		.map((step) => {
			return prepareStep(task, step);
		});

	if (!_.isFunction(task._doneCallback)) {
		task._doneCallback = noop; // noop
	}

	return task;
};


const preRunCallback = module.exports.preRunCallback =
function preRunCallback(task) {
	debugEvent(
		formattingUtils.cliMsg(task.name, chalk.bgWhite.blue('START'))
	);
};


const postRunCallback = module.exports.postRunCallback =
function postRunCallback(task) {
	debugEvent(
		formattingUtils.cliMsg(task.name, chalk.bgWhite.blue('END'))
	);
};


const runTask = module.exports.runTask =
function runTask(task, preCb=preRunCallback, postCb=postRunCallback) {
	debugEvent(`running ${formattingUtils.cliMsg(task.name)}`);
	preCb(task);

	// will be called in one of the `step._execute()`s
	task._wrappedDoneCallback = () => {
		task._doneCallback();
		postCb(task);
	};

	// keep track of how often task was run
	task.data.counter++;

	// execute each entry point step
	findRootSteps(task)
		.forEach((rootStep) => {
			const input = null; // there is no initial input
			const prevStep = null; // there is previous step
			try {
				rootStep._execute(input, prevStep);
			} catch (e) {
				common.printStacktrace(e);
			}
		});
	return task;
};


const startTask = module.exports.startTask =
function startTask(task) {
	debugEvent(`starting ${formattingUtils.cliMsg(task.name)}`);
	console.log(task.interval);
	if (task.interval) {
		if (task._timer) {
			task._timer.clear();
		}
		task._timer = later.setInterval(
			R.partial(runTask, [task]),
			task._schedule
		);
	} else {
		//
	};

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
		.map(startTask);
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


const decisionDefaults = module.exports.decisionDefaults = {
	'if': true,
	'else': true,
	'always': true // always true
};

const prepareDecision = module.exports.prepareDecision =
function prepareDecision(_decision) {
	let decision;

	if (_.isBoolean(_decision)) {
		decision = {
			'if': _decision,
			'else': !_decision
		};
	} else if (_decision === null || _decision === undefined) {
		decision = {
			'if': false,
			'else': false
		};
	} else if (_.isObject(_decision) && !_.isArray(_decision)) {
		decision = _decision;
	} else {
		throw new Error('invalid argument type');
	}

	return _.merge(
		{},
		decisionDefaults,
		decision,
		{ 'always': true }
	);
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


const defaultDoneCb = module.exports.defaultDoneCb =
function defaultDoneCb(err, output, decision) {
	if (err) {
		common.printStacktrace(err);
	}
};


const createExecuteFunction = module.exports.createExecuteFunction =
function createExecuteFunction(block, task, step) {
	return (input, prevStep, doneCb=defaultDoneCb) => {
		function wrappedDoneCb(err, output, _decision) {
			if (err) {
				return common.printStacktrace(err);
			}

			// based on this, it is decided on which of the
			// block's three outlets (`if`, `else`, `always`)
			// the flow continues.
			const decision = prepareDecision(_decision);

			// invoke child steps, based on decision
			invokeChildren(step, task.steps, output, decision);

			// must run AFTER `invokeChildren`
			delete task._currentlyExecutingSteps[step.id];
			if (isTaskDone(task)) {
				// last step has finished executing

				// some tests don't run `runTask()`, where `_wrappedDoneCallback`
				// is set
				(task._wrappedDoneCallback || noop)();
			}

			doneCb(err, output);
		}

		task._currentlyExecutingSteps[step.id] = true;
		const context = createContext(input, step, prevStep, task, block);
		block.fn(input, step, context, wrappedDoneCb);
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


const createContext = module.exports.createContext =
function createContext(input, step, prevStep, task, block) {
	return {
		input, step, prevStep, task, config,
		prepareDecision,
		saveTask: () => {
			saveTask(task);
		},
		debug: require('debug')('cause:block:'+step.block),
		logger: {
			log: winston.log,
			info: winston.info,
			warn: winston.warn,
			error: winston.error
		},
		formatting: formattingUtils // should this be here?
		// TODO: maybe blocks should provide their own formatting
		// function for their output?
	};
};


const invokeChildren = module.exports.invokeChildren =
function invokeChildren(currentStep, taskSteps, output, decision) {
	const input = output; // current step's output is next step's input
	R.keys(decision) // { if, else, always }
		.forEach(function(key) {
			if (!decision[key]) { return; }
			try {
				currentStep.flow[key] // children ids
					.forEach(function(id) {
						const childStep = common.getItemById(taskSteps, id);
						if (!childStep) {
							debugTask('child step not found');
							return;
						}
						if (!childStep._execute) {
							debugTask('child step does not have an _execute() function');
						}
						childStep._execute(input, currentStep);
					});
			} catch (e) {
				common.printStacktrace(e);
			}
		});
};


const removeTaskByIndex = module.exports.removeTaskByIndex =
function removeTaskByIndex(tasks, index) {
	return R.remove(index, 1, tasks);
};


const reloadTaskByIndex = module.exports.reloadTaskByIndex =
function reloadTaskByIndex(tasks, index, cb) {
	const task = tasks[index];

	if (task._filePath) {
		loadTaskFromFile(
			task._filePath,
			cb
		);
	} else {
		console.error('task was not loaded from file — can\'t reload');
		return;
	}
};


const addAndStartTask = module.exports.addAndStartTask =
function addAndStartTask(tasks, taskData) {
	return R.append(
		startTask(prepareTask(taskData)),
		tasks
	);
};






// TODO:

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


