'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const _ = require('lodash');
const glob = require('glob');
const mout = require('mout');
const cheerio = require('cheerio');
const FeedParser = require('feedparser');

const util = require('./util.js');

const config = require('../config.js');
const tasklib = require('../lib/tasklib.js');
const utils = require('../lib/utils.js');


describe(util.f1('lib/'), function() {

	// ############################################################
	describe(util.f2('tasklib.js'), function() {
	// 	describe(util.f3('.make_savable()'), function() {
	// 		var task = {
	// 			name: 'test task',
	// 			_internal: 'schedule',
	// 			steps: [
	// 				{
	// 					block: 'block',
	// 					_description: '_description',
	// 				}
	// 			]
	// 		};

	// 		it("should remove everything prefixed with '_'", function() {
	// 			var skip_steps = true;
	// 			var savable = tasklib.make_savable(task, skip_steps);
	// 			assert(!savable._internal);
	// 		});

	// 		it("should optionally include step objects, too", function() {
	// 			var skip_steps = false;
	// 			var savable = tasklib.make_savable(task, skip_steps);
	// 			assert(!savable._internal);
	// 			assert(!savable.steps[0]._description);
	// 		});
	// 	});

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

	// 		it("should not create a timer for tasks that don't specify an inteval", function() {
	// 			var task_data, task;

	// 			task_data = {
	// 				name: 'test task',
	// 				steps: [],
	// 				interval: null
	// 			};
	// 			task = tasklib.prepareTask(task_data);
	// 			assert(task._timer === undefined);

	// 			task_data.interval = false;
	// 			task = tasklib.prepareTask(task_data);
	// 			assert(task._timer === undefined);

	// 			task_data.interval = 'every 5 seconds';
	// 			task = tasklib.prepareTask(task_data);
	// 			assert(task._timer);

	// 			assert.throws(function() {
	// 				task_data.interval = 'asdf';
	// 				task = tasklib.prepareTask(task_data);
	// 			});

	// 			delete task_data.interval;
	// 			task = tasklib.prepareTask(task_data);
	// 			assert(task._timer === undefined);
	// 		});

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
	// 				assert(_.keys(task._currently_executing_steps).length === 0);
	// 				cb();
	// 			};
	// 			tasklib.run_task(task);
	// 			assert(_.keys(task._currently_executing_steps).length === 1);
	// 			// console.log(task._currently_executing_steps);
	// 		});

	// 		it('tasks should require a name', function() {
	// 			assert.throws(function() {
	// 				tasklib.prepareTask({ name: undefined });
	// 			});
	// 		});

	// 		it('should check if specified interval is valid', function() {
	// 			assert.throws(function() {
	// 				tasklib.prepareTask({
	// 					name: 'test',
	// 					interval: 'nonsense'
	// 				});
	// 			});
	// 		});
		});

		describe(util.f3('.prepareStep()'), function() {
			it('should throw error if step block is missing or empty', function() {
				const stepData1 = { block: undefined };
				const stepData2 = { block: '' };

				assert.throws(() => {
					tasklib.prepareStep(stepData1);
				});

				assert.throws(() => {
					tasklib.prepareStep(stepData2);
				});
			});
		});

	// 	describe(util.f3('.findRootSteps()'), function() {
	// 		it('should find all task entry points / blocks', function() {
	// 			var task = {
	// 				name: 'multi-entry-point-task',
	// 				steps: [
	// 					{	id: 'entry-1',
	// 						flow: {
	// 							'if': 'block-1'
	// 						}
	// 					},
	// 					{	id: 'entry-2',
	// 						flow: {
	// 							'always': 'block-1'
	// 						}
	// 					},
	// 					{	id: 'entry-3',
	// 						flow: {
	// 							'else': 'block-2'
	// 						}
	// 					},
	// 					{	id: 'entry-4',
	// 						flow: {}
	// 					},
	// 					// ------
	// 					{	id: 'block-1',
	// 						flow: {}
	// 					},
	// 					{	id: 'block-2',
	// 						flow: {}
	// 					},
	// 				]
	// 			};

	// 			const rootSteps = tasklib.findRootSteps(task);
	// 			assert(rootSteps.length === 4);
	// 			rootSteps.forEach(function(item) {
	// 				assert(mout.string.startsWith(item.id, 'entry'));
	// 			});
	// 		});
	// 	});


	// 	describe(util.f3('.prepare_flow()'), function() {
	// 		it('should make sure everything is sane', function() {
	// 			var _flow, flow;

	// 			_flow = {};
	// 			flow = tasklib.prepare_flow(_flow);
	// 			assert(flow['if'] !== undefined);

	// 			_flow = 'test';
	// 			flow = tasklib.prepare_flow(_flow);
	// 			assert(flow['if'] !== undefined);

	// 			_flow = null;
	// 			flow = tasklib.prepare_flow(_flow);
	// 			assert(flow['if'] !== undefined);
	// 			assert(_.isArray(flow['if']));

	// 			_flow = {
	// 				'if': 'asdf'
	// 			};
	// 			flow = tasklib.prepare_flow(_flow);
	// 			assert(flow['if'] !== undefined);
	// 		});
	// 	});

	// 	describe(util.f3('._prepare()'), function() {
	// 		it('should use (optional) defaults', function() {
	// 			var it, defaults;

	// 			it = { test: undefined };
	// 			defaults = { test: [1, 2, 3] };
	// 			it = tasklib._prepare(it, defaults);
	// 			assert(it.test.length > 0);

	// 			it = { test: [1, 2, 3] };
	// 			defaults = null;
	// 			it = tasklib._prepare(it, defaults);
	// 			assert(it.test.length > 0);

	// 			it = null;
	// 			defaults = { test: [1, 2, 3] };
	// 			it = tasklib._prepare(it, defaults);
	// 			assert(it.test.length > 0);
	// 		});
	// 	});


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
	});


	// // ############################################################
	// describe(util.f2('utils/filesystem.js'), function() {

	// 	describe(util.f3('.get_filename()'), function() {
	// 		it('should handle filenames correctly', function() {
	// 			var file;

	// 			file = '../asdf/asdfadf/filename.ext';
	// 			assert.equal(utils.filesystem.get_filename(file), 'filename');

	// 			file = 'filename.ext';
	// 			assert.equal(utils.filesystem.get_filename(file), 'filename');

	// 			file = 'filename.bla.ext';
	// 			assert.equal(utils.filesystem.get_filename(file), 'filename.bla');

	// 			file = '.ext';
	// 			assert.equal(utils.filesystem.get_filename(file), '');

	// 			file = '../.ext';
	// 			assert.equal(utils.filesystem.get_filename(file), '');
	// 		});
	// 	});

	// 	describe(util.f3('.load_json()'), function() {
	// 		it('throw an error when json input is bad', function() {
	// 			assert.throws(function() {
	// 				file = 'test/files/bad.json';
	// 				utils.filesystem.load_json(file);
	// 			});
	// 		});
	// 	});

	// });

});
