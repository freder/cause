'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const _ = require('lodash');
const R = require('ramda');
const glob = require('glob');
const mout = require('mout');
const cheerio = require('cheerio');
const FeedParser = require('feedparser');

const util = require('./util.js');

const config = require('../config.js');
const tasklib = require('../lib/tasklib.js');
const utils = require('../lib/utils.js');


describe(util.f1('lib/'), function() {

	// ————————————————————————————————————————————————————————————
	describe(util.f2('tasklib.js'), function() {
		describe(util.f3('.startsWithUnderscore()'), function() {
			it('should work', function() {
				assert(tasklib.startsWithUnderscore('_yes'));
				assert(!tasklib.startsWithUnderscore('no'));
			});
		});


		describe(util.f3('.makeSavable()'), function() {
			const task = {
				name: 'test task',
				_internal: 'schedule',
				steps: [
					{
						block: 'block',
						_description: '_description',
						flow: {}
					}
				],
			};

			it("should remove everything prefixed with '_'", function() {
				const skipSteps = true;
				const savableTask = tasklib.makeSavable(task, skipSteps);
				assert(!savableTask._internal);
			});

			it("should optionally do the same thing with step objects, too", function() {
				const skipSteps = false;
				const savableTask = tasklib.makeSavable(task, skipSteps);
				assert(!savableTask._internal);
				assert(!savableTask.steps[0]._description);
			});
		});

		describe(util.f3('.prepareTask()'), function() {
			it('should set defaults for missing fields', function() {
				const taskData = {
					name: 'task name',
					slug: undefined,
					steps: undefined,
					data: undefined,
				};

				const prepared = tasklib.prepareTask(taskData);
				assert(prepared.slug === 'task-name');
				assert(prepared.steps.length === 0);
				assert(prepared.data.counter === 0);
			});

			it('should throw error if task name is missing or empty', function() {
				const taskData1 = { name: undefined };
				const taskData2 = { name: '' };

				assert.throws(() => {
					tasklib.prepareTask(taskData1);
				});

				assert.throws(() => {
					tasklib.prepareTask(taskData2);
				});
			});


	// 		it("should keep track of currently executing steps", function(cb) {
	// 			var block = {
	// 				fn: function(input, step, context, done) {
	// 					setTimeout(function() {
	// 						var output = null;
	// 						var decision = true;
	// 						done(null, output, decision);
	// 					}, 100);
	// 				}
	// 			};

	// 			var task = tasklib.prepareTask({
	// 				name: 'test task'
	// 			});

	// 			var step = { id: 'test-step' };
	// 			step._execute = tasklib.create_execute_function(block, task, step);

	// 			task.steps = [step];
	// 			task._done = function() {
	// 				// console.log(task._currently_executing_steps);
	// 				assert(R.keys(task._currently_executing_steps).length === 0);
	// 				cb();
	// 			};
	// 			tasklib.run_task(task);
	// 			assert(R.keys(task._currently_executing_steps).length === 1);
	// 			// console.log(task._currently_executing_steps);
	// 		});
		});


		describe(util.f3('.addDefaults()'), function() {
			it('should work without defaults argument', function() {
				assert(
					tasklib.addDefaults(
						{ attr: 'a' },
						undefined
					).attr === 'a'
				);
			});

			it('should work without first argument', function() {
				assert(
					tasklib.addDefaults(
						undefined,
						{ attr: 'a' }
					).attr === 'a'
				);
			});

			it('should work without both', function() {
				assert(
					!!tasklib.addDefaults(
						undefined,
						undefined
					)
				);
			});

			it('should not overwrite existing keys', function() {
				assert(
					tasklib.addDefaults(
						{ attr: 'a' },
						{ attr: 'b' }
					).attr === 'a'
				);
			});
		});


		describe(util.f3('.prepareStep()'), function() {
			const task = {};

			it('should throw error if step block is missing or empty', function() {
				const stepData1 = { block: undefined };
				const stepData2 = { block: '' };

				assert.throws(() => {
					tasklib.prepareStep(task, stepData1);
				});

				assert.throws(() => {
					tasklib.prepareStep(task, stepData2);
				});
			});

			it('should add default values', function() {
				const stepData = {
					block: 'assert' // s.th. that exits
				};
				const preparedStep = tasklib.prepareStep(task, stepData);
				assert(!!preparedStep.flow);
				assert(!!preparedStep.options);
			});
		});


		describe(util.f3('.getTaskFiles()'), function() {
			const tasksDirPath = path.join(__dirname, './tasks');

			it('should find the files', function() {
				const taskFiles = tasklib.getTaskFiles(tasksDirPath);
				assert(taskFiles.length === 1);
			});
		});


		describe(util.f3('.loadTaskFromFile()'), function() {
			const tasksDirPath = path.join(__dirname, './tasks');

			it('should load task data', function(done) {
				const taskFileName = 'test.json';
				const taskPath = path.join(tasksDirPath, taskFileName);
				tasklib.loadTaskFromFile(taskPath, (err, taskData) => {
					assert(taskData.name === 'test task');
					assert(taskData.interval === 'every 10 mins');
					assert(taskData.steps.length === 0);

					assert(!!taskData._filePath);

					done();
				});
			});
		});


		describe(util.f3('.loadBlock()'), function() {
			const blocksDirPath = path.join(__dirname, './blocks');

			it('should throw error if block does not exist', function() {
				const blockName = 'does-not-exist';
				assert.throws(function() {
					const block = tasklib.loadBlock(blocksDirPath, blockName);
				});
			});

			it('should successfully load local block', function() {
				const blockName = 'cause-test';
				const block = tasklib.loadBlock(blocksDirPath, blockName);
				assert(block.success === true);
			});

			const blockName = 'test';
			const block = tasklib.loadBlock(blocksDirPath, blockName);
			it('should successfully load local file', function() {
				assert(block.success === true);
			});
			it('should set defaults', function() {
				assert(!!block.defaults);
			});
		});


		describe(util.f3('.startTask()'), function() {
			it('should let task do its own thing, if interval is undefined', function() {
				const task = tasklib.prepareTask({
					name: 'test-task',
					interval: undefined,
				});
				const startedTask = tasklib.startTask(task);
				assert(!startedTask.interval);
				assert(!startedTask._schedule);
				assert(!startedTask._timer);
			});

			it('should throw error, if interval is invalid', function() {
				const task = tasklib.prepareTask({
					name: 'test-task',
					interval: 'every 3 moons',
				});
				assert.throws(() => {
					const startedTask = tasklib.startTask(task);
				});
			});

			it('should create a schedule and timer', function() {
				const task = tasklib.prepareTask({
					name: 'test-task',
					interval: 'every 5 seconds',
				});
				const startedTask = tasklib.startTask(task);
				assert(!!startedTask._schedule);
				assert(!!startedTask._timer);
				startedTask._timer.clear();
			});

			it('should create other fields', function() {
				const task = tasklib.prepareTask({
					name: 'test-task',
					interval: 'every 5 seconds',
				});
				const startedTask = tasklib.startTask(task);
				assert(!!startedTask._currentlyExecutingSteps);
				startedTask._timer.clear();
			});
		});


		describe(util.f3('.findRootSteps()'), function() {
			it('should find all task entry points', function() {
				var task = {
					name: 'multi-entry-point-task',
					steps: [
						{
							id: 'entry-1',
							flow: { 'if': 'block-1' }
						},
						{
							id: 'entry-2',
							flow: { 'always': 'block-1' }
						},
						{
							id: 'entry-3',
							flow: { 'else': 'block-2' }
						},
						{
							id: 'entry-4',
							flow: {}
						},
						// ------
						{
							id: 'block-1',
							flow: {}
						},
						{
							id: 'block-2',
							flow: {}
						},
					]
				};

				const rootSteps = tasklib.findRootSteps(task);
				assert(rootSteps.length === 4);
				rootSteps.forEach(function(item) {
					assert(mout.string.startsWith(item.id, 'entry'));
				});
			});
		});


		describe(util.f3('.prepareFlow()'), function() {
			it('should make sure everything is sane', function() {
				let flow;
				let preparedFlow;

				flow = {};
				preparedFlow = tasklib.prepareFlow(flow);
				assert(preparedFlow['if'] !== undefined);

				flow = 'test';
				preparedFlow = tasklib.prepareFlow(flow);
				assert(preparedFlow['if'] !== undefined);

				flow = null;
				preparedFlow = tasklib.prepareFlow(flow);
				assert(preparedFlow['if'] !== undefined);
				assert(_.isArray(preparedFlow['if']));

				flow = { 'if': 'asdf' };
				preparedFlow = tasklib.prepareFlow(flow);
				assert(preparedFlow['if'] !== undefined);
			});
		});


		describe(util.f3('.flowDecision()'), function() {
			it('should work with boolean argument', function() {
				const decision = tasklib.flowDecision(false);
				assert(decision['if'] === false);
				assert(decision['else'] === true);
			});

			it('should work with object argument', function() {
				const decision = tasklib.flowDecision({
					'if': false
				});
				assert(decision['if'] === false);
				assert(decision['else'] === true);
			});

			it('should work with undefined/null argument', function() {
				let decision = tasklib.flowDecision(null);
				assert(decision['if'] === false);
				assert(decision['else'] === false);

				decision = tasklib.flowDecision(undefined);
				assert(decision['if'] === false);
				assert(decision['else'] === false);
			});

			it('`always` should always be true', function() {
				const decision = tasklib.flowDecision({ 'always': false });
				assert(decision['always'] === true);
			});

			it('should leave defaults untouched', function() {
				tasklib.flowDecision({
					'if': false,
					'else': false,
					'always': false
				});
				assert(tasklib.flowDecisionDefaults['if'] === true);
				assert(tasklib.flowDecisionDefaults['else'] === true);
				assert(tasklib.flowDecisionDefaults['always'] === true);
			});

			it('should throw error on wrong argument type', function() {
				const decision = [
					{ 'if': false },
					{ 'else': false },
					{ 'always': false }
				];
				assert.throws(() => {
					tasklib.flowDecision(decision);
				});
			});
		});


		describe(util.f3('.createExecuteFunction()'), function() {
			it('should return a function', function() {
				const execFn = tasklib.createExecuteFunction();
				assert(_.isFunction(execFn));
			});

			let doneCallback_hasRun = false;
			let cb_hasRun = false;
			it('should (un)register itself from currently executing steps', function() {
				let done;
				const block = {
					fn: (input, step, context, _done) => {
						done = _done;
					}
				};
				let task = {
					_currentlyExecutingSteps: {},
					_doneCallback: () => {
						doneCallback_hasRun = true;
					}
				};
				const step = {
					id: 'currentStep',
					flow: tasklib.prepareFlow()
				};
				const prevStep = {};
				const input = 'input';
				const cb = () => {
					cb_hasRun = true;
				};

				const execFn = tasklib.createExecuteFunction(block, task, step);
				execFn(input, prevStep, cb);
				assert(!!task._currentlyExecutingSteps[step.id]);

				done(null);
				assert(!task._currentlyExecutingSteps[step.id]);
			});

			it('should call all the callbacks', function() {
				assert(cb_hasRun);
				assert(doneCallback_hasRun);
			});
		});


		describe(util.f3('.isTaskDone()'), function() {
			it('should work', function() {
				assert(tasklib.isTaskDone({}));
				assert(tasklib.isTaskDone({ _currentlyExecutingSteps: {} }));
				assert(!tasklib.isTaskDone({ _currentlyExecutingSteps: { 'asdf': true } }));
			});
		});


		describe(util.f3('.invokeChildren()'), function() {
			it('should work', function() {
				const flow = {
					'if': ['step-if'],
					'else': ['step-else'],
					'always': ['step-always'],
				};
				const currentStep = { flow };
				let success;
				const taskSteps = [
					{
						id: 'step-if',
						_execute: () => {
							success = true;
						}
					},
					{
						id: 'step-else',
						_execute: () => {
							success = false;
						}
					}/*,
					{
						id: 'step-always',
						_execute: () => {
							console.log('always');
						}
					}*/
				];
				const output = 'output';
				const flowDecision = {
					'if': true,
					'else': false,
					'always': true,
				};

				tasklib.invokeChildren(
					currentStep,
					taskSteps,
					output,
					flowDecision
				);
				assert(success === true);
			});
		});


	// 	describe(util.f3('.run_task()'), function() {
	// 		it('should work with single step tasks', function() {
	// 			var has_run = false;
	// 			var block = {
	// 				fn: function(input, step, context, done) {
	// 					has_run = true;
	// 					done(null, 'output', true);
	// 				}
	// 			};

	// 			var task = tasklib.prepareTask({
	// 				name: 'single step task'
	// 			});

	// 			var step = { id: 'single step' };
	// 			step._execute = tasklib.create_execute_function(block, task, step);

	// 			task.steps = [step];
	// 			task._done = function() {
	// 				assert(has_run);
	// 			};
	// 			tasklib.run_task(task);
	// 		});
	// 	});


		describe(util.f3('.addAndStartTask()'), function() {
			const tasks = [];
			const taskData = {
				name: 'test-task'
			};
			const newTasks = tasklib.addAndStartTask(tasks, taskData);

			it('should add a task', function() {
				assert(newTasks.length === 1);
			});
		});


		describe(util.f3('.addAndStartTask()'), function() {
			const tasks = [{ name: '0' }, { name: '1' }];
			const newTasks = tasklib.removeTaskByIndex(tasks, 0);

			it('should remove the right task', function() {
				assert(newTasks.length === 1);
				assert(newTasks[0].name === '1');
			});
		});
	});

});
