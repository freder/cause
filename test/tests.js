'use strict';

const assert = require('assert');
const path = require('path');
const _ = require('lodash');
const mout = require('mout');

const util = require('./util.js');

// const config = require('../config.js');
const tasklib = require('../lib/tasklib.js');


describe(util.f1('lib/'), () => {
	// ————————————————————————————————————————————————————————————
	describe(util.f2('tasklib.js'), () => {
		describe(util.f3('.startsWithUnderscore()'), () => {
			it('should work', () => {
				assert(tasklib.startsWithUnderscore('_yes'));
				assert(!tasklib.startsWithUnderscore('no'));
			});
		});

		describe(util.f3('.makeSavable()'), () => {
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

			it("should remove everything prefixed with '_'", () => {
				const skipSteps = true;
				const savableTask = tasklib.makeSavable(task, skipSteps);
				assert(!savableTask._internal);
			});

			it('should optionally do the same thing with step objects, too', () => {
				const skipSteps = false;
				const savableTask = tasklib.makeSavable(task, skipSteps);
				assert(!savableTask._internal);
				assert(!savableTask.steps[0]._description);
			});
		});

		describe(util.f3('.prepareTask()'), () => {
			it('should set defaults for missing fields', () => {
				const taskData = {
					name: 'task name',
					slug: undefined,
					steps: undefined,
					data: undefined,
				};

				const task = tasklib.prepareTask(taskData);
				assert(task.slug === 'task-name');
				assert(task.steps.length === 0);
				assert(task.data.counter === 0);

				assert(!!task._currentlyExecutingSteps);
			});

			it('should throw error if task name is missing or empty', () => {
				const taskData1 = { name: undefined };
				const taskData2 = { name: '' };

				assert.throws(() => {
					tasklib.prepareTask(taskData1);
				});

				assert.throws(() => {
					tasklib.prepareTask(taskData2);
				});
			});

			it('should let task do its own thing, if interval is undefined', () => {
				const task = tasklib.prepareTask({
					name: 'test-task',
					interval: undefined,
				});
				assert(!task.interval);
				assert(!task._schedule);
			});

			it('should throw error, if interval is invalid', () => {
				assert.throws(() => {
					const task = tasklib.prepareTask({
						name: 'test-task',
						interval: 'every 3 moons',
					});
				});
			});

			it('should create a schedule', () => {
				const task = tasklib.prepareTask({
					name: 'test-task',
					interval: 'every 5 seconds',
				});
				assert(!!task._schedule);
			});

			it('should create a _doneCallback() function, if it does not exist', () => {
				const task = tasklib.prepareTask({
					name: 'test',
					interval: false
				});
				assert(!!task._doneCallback);
			});
		});


		describe(util.f3('.addDefaults()'), () => {
			it('should work without defaults argument', () => {
				assert(
					tasklib.addDefaults(
						{ attr: 'a' },
						undefined
					).attr === 'a'
				);
			});

			it('should work without first argument', () => {
				assert(
					tasklib.addDefaults(
						undefined,
						{ attr: 'a' }
					).attr === 'a'
				);
			});

			it('should work without both', () => {
				assert(
					!!tasklib.addDefaults(
						undefined,
						undefined
					)
				);
			});

			it('should not overwrite existing keys', () => {
				assert(
					tasklib.addDefaults(
						{ attr: 'a' },
						{ attr: 'b' }
					).attr === 'a'
				);
			});
		});


		describe(util.f3('.prepareStep()'), () => {
			const task = {};

			it('should throw error if step block is missing or empty', () => {
				const stepData1 = { block: undefined };
				const stepData2 = { block: '' };

				assert.throws(() => {
					tasklib.prepareStep(task, stepData1);
				});

				assert.throws(() => {
					tasklib.prepareStep(task, stepData2);
				});
			});

			it('should add default values', () => {
				const stepData = {
					block: 'assert' // s.th. that exits
				};
				const preparedStep = tasklib.prepareStep(task, stepData);
				assert(!!preparedStep.flow);
				assert(!!preparedStep.config);
			});
		});


		describe(util.f3('.getTaskFiles()'), () => {
			const tasksDirPath = path.join(__dirname, './tasks');

			it('should find the files', () => {
				const taskFiles = tasklib.getTaskFiles(tasksDirPath);
				assert(taskFiles.length === 1);
			});
		});


		describe(util.f3('.loadTaskFromFile()'), () => {
			const tasksDirPath = path.join(__dirname, './tasks');

			it('should load task data', (done) => {
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


		describe(util.f3('.loadBlock()'), () => {
			const blocksDirPath = path.join(__dirname, './blocks');

			it('should throw error if block does not exist', () => {
				const blockName = 'does-not-exist';
				assert.throws(function() {
					const block = tasklib.loadBlock(blocksDirPath, blockName);
				});
			});

			it('should successfully load local block', () => {
				const blockName = 'cause-test';
				const block = tasklib.loadBlock(blocksDirPath, blockName);
				assert(block.success === true);
			});

			const blockName = 'test';
			const block = tasklib.loadBlock(blocksDirPath, blockName);
			it('should successfully load local file', () => {
				assert(block.success === true);
			});
			it('should set defaults', () => {
				assert(!!block.defaults);
			});
		});


		describe(util.f3('.startTask()'), () => {
			it('should create a timer', () => {
				const task = tasklib.prepareTask({
					name: 'test-task',
					interval: 'every 5 seconds',
				});
				const startedTask = tasklib.startTask(task);
				assert(!!startedTask._timer);
				startedTask._timer.clear();
			});
		});


		describe(util.f3('.findRootSteps()'), () => {
			it('should find all task entry points', () => {
				const task = {
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


		describe(util.f3('.prepareFlow()'), () => {
			it('should make sure everything is sane', () => {
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


		describe(util.f3('.prepareDecision()'), () => {
			it('should work with boolean argument', () => {
				const decision = tasklib.prepareDecision(false);
				assert(decision['if'] === false);
				assert(decision['else'] === true);
			});

			it('should work with object argument', () => {
				const decision = tasklib.prepareDecision({
					'if': false
				});
				assert(decision['if'] === false);
				assert(decision['else'] === true);
			});

			it('should work with undefined/null argument', () => {
				let decision = tasklib.prepareDecision(null);
				assert(decision['if'] === false);
				assert(decision['else'] === false);

				decision = tasklib.prepareDecision(undefined);
				assert(decision['if'] === false);
				assert(decision['else'] === false);
			});

			it('`always` should always be true', () => {
				const decision = tasklib.prepareDecision({ 'always': false });
				assert(decision['always'] === true);
			});

			it('should leave defaults untouched', () => {
				tasklib.prepareDecision({
					'if': false,
					'else': false,
					'always': false
				});
				assert(tasklib.decisionDefaults['if'] === true);
				assert(tasklib.decisionDefaults['else'] === true);
				assert(tasklib.decisionDefaults['always'] === true);
			});

			it('should throw error on wrong argument type', () => {
				const decision = [
					{ 'if': false },
					{ 'else': false },
					{ 'always': false }
				];
				assert.throws(() => {
					tasklib.prepareDecision(decision);
				});
			});
		});


		describe(util.f3('.createExecuteFunction()'), () => {
			it('should return a function', () => {
				const execFn = tasklib.createExecuteFunction();
				assert(_.isFunction(execFn));
			});

			// let taskDoneCallbackHasRun = false;
			let stepDoneCallbackHasRun = false;
			it('should (un)register itself from currently executing steps', () => {
				let done;
				const task = tasklib.prepareTask({
					name: 'task',
					steps: [],
					_currentlyExecutingSteps: {},
				});
				const block = {
					main: (step, context, config, input, _done) => {
						done = _done; // steal the callback
					}
				};
				const step = {
					id: 'current-step',
					flow: tasklib.prepareFlow()
				};

				const execFn = tasklib.createExecuteFunction(block, task, step);
				const prevStep = undefined;
				const input = 'input';
				const cb = () => {
					stepDoneCallbackHasRun = true;
				};
				execFn(input, prevStep, cb); // `cb` becomes `done`
				assert(!!task._currentlyExecutingSteps[step.id]);

				done(null);
				assert(!task._currentlyExecutingSteps[step.id]);
			});

			it('should call the callback', () => {
				assert(stepDoneCallbackHasRun);
			});
		});


		describe(util.f3('.prepareStepConfig()'), () => {
			it('should be cascading', () => {
				const blockName = 'cause-block-name';
				const config = {
					[blockName]: {
						a: 'config',
						b: 'config',
						c: 'config',
					}
				};
				const task = {
					config: {
						[blockName]: {
							b: 'task',
							c: 'task',
						}
					}
				};
				const step = {
					block: blockName,
					config: {
						c: 'step'
					}
				};

				const cfg = tasklib.prepareStepConfig(config, step, task, step.block);
				// console.log(c);
				assert(cfg.a === 'config');
				assert(cfg.b === 'task');
				assert(cfg.c === 'step');
			});
		});


		describe(util.f3('.isTaskDone()'), () => {
			it('should work', () => {
				assert(tasklib.isTaskDone({}));
				assert(tasklib.isTaskDone({ _currentlyExecutingSteps: {} }));
				assert(!tasklib.isTaskDone({ _currentlyExecutingSteps: { 'asdf': true } }));
			});
		});


		describe(util.f3('.invokeChildren()'), () => {
			it('should work', () => {
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


		describe(util.f3('.runTask()'), () => {
			const step = {
				id: 'single step',
				flow: tasklib.prepareFlow()
			};

			it('should work with single step tasks', () => {
				let hasRun = false;
				const block = {
					main: (step, context, config, input, done) => {
						hasRun = true;
						const decision = true;
						done(null, 'output', decision);
					}
				};

				const task = tasklib.prepareTask({
					name: 'single step task',
					interval: false
				});

				step._execute = tasklib.createExecuteFunction(block, task, step);
				task.steps = [step];

				task._doneCallback = () => {
					assert(hasRun);
				};
				tasklib.runTask(task);
			});

			it('should run pre and post task callbacks', (done) => {
				const block = {
					main: (step, context, config, input, done) => {
						const decision = true;
						done(null, 'output', decision);
					}
				};
				const task = tasklib.prepareTask({
					name: 'task',
					interval: false
				});
				step._execute = tasklib.createExecuteFunction(block, task, step);
				task.steps = [step];

				let preCbHasRun = false;
				let postCbHasRun = false;
				tasklib.runTask(
					task,
					(task) => {
						preCbHasRun = true;
						// console.log('pre');
					},
					(task) => {
						postCbHasRun = true;
						// console.log('post');

						assert(preCbHasRun);
						assert(postCbHasRun);
						done();
					}
				);
			});
		});


		describe(util.f3('.addAndStartTask()'), () => {
			const tasks = [];
			const taskData = {
				name: 'test-task'
			};
			const newTasks = tasklib.addAndStartTask(tasks, taskData);

			it('should add a task', () => {
				assert(newTasks.length === 1);
			});
		});


		describe(util.f3('.addAndStartTask()'), () => {
			const tasks = [{ name: '0' }, { name: '1' }];
			const newTasks = tasklib.removeTaskByIndex(tasks, 0);

			it('should remove the right task', () => {
				assert(newTasks.length === 1);
				assert(newTasks[0].name === '1');
			});
		});
	});
});
