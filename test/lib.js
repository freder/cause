var assert = require('assert');
var path = require('path');
var fs = require('fs');
var chalk = require('chalk');
var _ = require('lodash');
var glob = require('glob');
var cheerio = require('cheerio');
var FeedParser = require('feedparser');

var util = require('./util.js');

var config = require('../config.js');
var tasklib = require('../lib/tasklib.js');
var utils = require('../lib/utils.js');


describe(util.f1('lib/'), function() {

	// ############################################################
	describe(util.f2('tasklib.js'), function() {
		describe(util.f3('.make_savable()'), function() {
			it("should remove everything prefixed with '_'", function() {
				var task = {
					name: 'test task',
					_internal: 'schedule',
					steps: [
						{
							block: 'block',
							_description: '_description',
						}
					]
				};
				var skip_steps = false;
				var savable = tasklib.make_savable(task, skip_steps);
				assert(savable._internal === undefined);
				assert(savable.steps[0]._description === undefined);
			});
		});

		describe(util.f3('.prepare_task()'), function() {
			it("should not create a timer for tasks that don't specify an inteval", function() {
				var task_data, task;

				task_data = {
					name: 'test task',
					steps: [],
					interval: null
				};
				task = tasklib.prepare_task(task_data);
				assert(task._timer === undefined);

				task_data.interval = false;
				task = tasklib.prepare_task(task_data);
				assert(task._timer === undefined);

				task_data.interval = 'every 5 seconds';
				task = tasklib.prepare_task(task_data);
				assert(task._timer);

				assert.throws(function() {
					task_data.interval = 'asdf';
					task = tasklib.prepare_task(task_data);
				});

				delete task_data.interval;
				task = tasklib.prepare_task(task_data);
				assert(task._timer === undefined);
			});

			it("should keep track of currently executing steps", function(cb) {
				var block = {
					fn: function(task, step, input, prev_step, done) {
						setTimeout(function() {
							var output = null;
							var decision = true;
							done(null, output, decision);
						}, 100);
					}
				};

				var task = tasklib.prepare_task({
					name: 'test task'
				});

				var step = { id: 'test-step' };
				step._execute = tasklib.create_step_function(block, task, step);

				task.steps = [step];
				task._done = function() {
					// console.log(task._currently_executing_steps);
					assert(_.keys(task._currently_executing_steps).length === 0);
					cb();
				};
				tasklib.run_task(task);
				assert(_.keys(task._currently_executing_steps).length === 1);
				// console.log(task._currently_executing_steps);
			});

			it('tasks should require a name', function() {
				assert.throws(function() {
					tasklib.prepare_task({ name: undefined });
				});
			});

			it('should check if specified interval is valid', function() {
				assert.throws(function() {
					tasklib.prepare_task({
						name: 'test',
						interval: 'nonsense'
					});
				});
			});
		});

		describe(util.f3('.find_root_steps()'), function() {
			it('should find all task entry points / blocks', function() {
				var task = {
					name: 'multi-entry-point-task',
					steps: [
						{	id: 'entry-1',
							flow: {
								'if': 'block-1'
							}
						},
						{	id: 'entry-2',
							flow: {
								'always': 'block-1'
							}
						},
						{	id: 'entry-3',
							flow: {
								'else': 'block-2'
							}
						},
						{	id: 'entry-4',
							flow: {}
						},
						// ------
						{	id: 'block-1',
							flow: {}
						},
						{	id: 'block-2',
							flow: {}
						},
					]
				};

				assert(tasklib.find_root_steps(task).length === 4);
			});
		});

		describe(util.f3('.flow_decision()'), function() {
			it('should leave defaults untouched', function() {
				tasklib.flow_decision(false);
				assert(tasklib.flow_decision_defaults['if'] === true);
				// assert(tasklib.flow_decision_defaults['else'] === true);
				// assert(tasklib.flow_decision_defaults['always'] === true);
			});
		});

		describe(util.f3('.prepare_flow()'), function() {
			it('should make sure everything is sane', function() {
				var _flow, flow;

				_flow = {};
				flow = tasklib.prepare_flow(_flow);
				assert(flow['if'] !== undefined);

				_flow = 'test';
				flow = tasklib.prepare_flow(_flow);
				assert(flow['if'] !== undefined);

				_flow = null;
				flow = tasklib.prepare_flow(_flow);
				assert(flow['if'] !== undefined);
				assert(_.isArray(flow['if']));

				_flow = {
					'if': 'asdf'
				};
				flow = tasklib.prepare_flow(_flow);
				assert(flow['if'] !== undefined);
			});
		});

		describe(util.f3('._prepare()'), function() {
			it('should use (optional) defaults', function() {
				var it, defaults;

				it = { test: undefined };
				defaults = { test: [1, 2, 3] };
				it = tasklib._prepare(it, defaults);
				assert(it.test.length > 0);

				it = { test: [1, 2, 3] };
				defaults = null;
				it = tasklib._prepare(it, defaults);
				assert(it.test.length > 0);

				it = null;
				defaults = { test: [1, 2, 3] };
				it = tasklib._prepare(it, defaults);
				assert(it.test.length > 0);
			});
		});


		describe(util.f3('.run_task()'), function() {
			it('should work with single step tasks', function() {
				var has_run = false;
				var block = {
					fn: function(task, step, input, prev_step, done) {
						has_run = true;
						done(null, 'output', true);
					}
				};

				var task = tasklib.prepare_task({
					name: 'single step task'
				});

				var step = { id: 'single step' };
				step._execute = tasklib.create_step_function(block, task, step);

				task.steps = [step];
				task._done = function() {
					assert(has_run);
				};
				tasklib.run_task(task);
			});
		});
	});


	// ############################################################
	describe(util.f2('utils/filesystem.js'), function() {

		describe(util.f3('.get_filename()'), function() {
			it('should handle filenames correctly', function() {
				var file;

				file = '../asdf/asdfadf/filename.ext';
				assert.equal(utils.filesystem.get_filename(file), 'filename');

				file = 'filename.ext';
				assert.equal(utils.filesystem.get_filename(file), 'filename');

				file = 'filename.bla.ext';
				assert.equal(utils.filesystem.get_filename(file), 'filename.bla');

				file = '.ext';
				assert.equal(utils.filesystem.get_filename(file), '');

				file = '../.ext';
				assert.equal(utils.filesystem.get_filename(file), '');
			});
		});

		describe(util.f3('.load_json()'), function() {
			it('throw an error when json input is bad', function() {
				assert.throws(function() {
					file = 'test/files/bad.json';
					utils.filesystem.load_json(file);
				});
			});
		});

	});


	// ############################################################
	describe(util.f2('utils/parse.js'), function() {

		describe(util.f3('.time()'), function() {
			it('should parse time', function() {
				var parsed;
				parsed = utils.parse.time('12 minutes');
				assert(parsed.minutes === 12);

				parsed = utils.parse.time('12 minutes ago');
				assert(_.isEmpty(parsed));
			});
		});

	});


	// ############################################################
	describe(util.f2('utils/scraping.js'), function() {

		describe(util.f3('.query()'), function() {
			it('should work with css and jquery', function() {
				var html = ' \
					<div id="container"> \
						<div class="div">div</div> \
						<span>span</span> \
					</div>';
				var $ = cheerio.load(html);
				var query, $result;

				query = '$("#container div").first()';
				$result = utils.scraping.query('jquery', query, html);
				assert($result.text().trim() == 'div');

				query = '#container span';
				$result = utils.scraping.query('css', query, html);
				assert($result.text().trim() == 'span');

				query = '#notfound';
				var result = utils.scraping.query('css', query, html);
				assert(result.length === 0);

				assert(utils.scraping.query('never_heard_of_this', query, html) === null);
			});
		});

	});


	// ############################################################
	describe(util.f2('utils/feed.js'), function() {

		describe(util.f3('.process_feed()'), function() {
			it('should work', function(done) {
				var feedparser = new FeedParser();
				fs.createReadStream('test/files/feed.xml')
					.pipe(feedparser);

				utils.feed.process_feed({
					feedparser: feedparser,
					seen_guids: ['1111'],
					seen_pubdate: undefined
				},
				function(err, result) {
					if (err) { throw err; }

					assert(result.items.length === 3);
					assert(result.new_items.length === 2);
					assert(result.new_items.indexOf('1111') === -1);

					done();
				});
			});
		});

	});

});
