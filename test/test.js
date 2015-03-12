var assert = require('assert');
var path = require('path');
var chalk = require('chalk');
var R = require('ramda');
var _ = require('lodash');

var root = path.resolve('./');
console.log(chalk.blue(root));
global.paths = {
	root: root,
	lib: path.join(root, 'lib'),
	blocks: path.join(root, 'blocks')
};
var tasklib = require('../lib/tasklib.js');
var helper = require('../lib/helper.js');

function f(s) {
	return chalk.bgBlue(s);
}


describe('lib/', function() {

	describe('tasklib.js', function() {
		describe(f('#make_savable()'), function() {
			it("should remove everything prefixed with '_'", function() {
				var task = {
					name: 'test task',
					_internal: 'schedule'
				};
				var savable = tasklib.make_savable(task);
				assert(savable._internal === undefined);
			});
		});

		describe(f('#prepare_task()'), function() {
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
		});

		describe(f('#flow_decision()'), function() {
			it('should leave defaults untouched', function() {
				tasklib.flow_decision(false);
				assert(tasklib.flow_decision_defaults['if'] === true);
				// assert(tasklib.flow_decision_defaults['else'] === true);
				// assert(tasklib.flow_decision_defaults['anyway'] === true);
			});
		});

		describe(f('#normalize_step_flow()'), function() {
			it('should make sure everything is sane', function() {
				var _flow, flow;
				
				_flow = {};
				flow = tasklib.normalize_step_flow(_flow);
				assert(flow['if'] !== undefined);

				_flow = 'test';
				flow = tasklib.normalize_step_flow(_flow);
				assert(flow['if'] !== undefined);

				_flow = null;
				flow = tasklib.normalize_step_flow(_flow);
				assert(flow['if'] !== undefined);
				assert(_.isArray(flow['if']));

				_flow = {
					'if': 'asdf'
				};
				flow = tasklib.normalize_step_flow(_flow);
				assert(flow['if'] !== undefined);
			});
		});

		describe(f('#normalize()'), function() {
			it('should make sure everything is sane', function() {
				var data;
				var step = {
					data: { test: [1, 2, 3] }
				};
				var defaults = {
					test: []
				};

				data = tasklib.normalize(step.data, defaults);
				assert(data.test.length > 0);
			});
		});
	});

	// ————————————————————

	describe('helper.js', function() {
		var glob = require('glob');
		var config = require('../config.js');
		var helper = require('../lib/helper.js');

		describe(f('#get_filename()'), function() {
			it('should handle filenames correctly', function() {
				var file;

				file = '../asdf/asdfadf/filename.ext';
				assert.equal(helper.get_filename(file), 'filename');
				
				file = 'filename.ext';
				assert.equal(helper.get_filename(file), 'filename');
				
				file = 'filename.bla.ext';
				assert.equal(helper.get_filename(file), 'filename.bla');
				
				file = '.ext';
				assert.equal(helper.get_filename(file), '');

				file = '../.ext';
				assert.equal(helper.get_filename(file), '');
			});
		});
	});

	// ————————————————————

	describe('blocks/jaap.js', function() {
		var jaap = require('../blocks/jaap.js');

		describe(f('#parse_info()'), function() {
			it('should work with inconsistent data', function() {
				var info;
				var data;

				info = '';
				data = jaap.parse_info(info);
				assert(data.type == '' && data.rooms == undefined && data.area == '');

				info = 'Appartement, 60m²';
				data = jaap.parse_info(info);
				assert(data.type == 'Appartement' && data.rooms == undefined && data.area == '60m²');

				info = 'Appartement, 1 kamer';
				data = jaap.parse_info(info);
				assert(data.type == 'Appartement' && data.rooms == 1 && data.area == '');

				info = '2 kamers, 60m²';
				data = jaap.parse_info(info);
				assert(data.type == '' && data.rooms == 2 && data.area == '60m²');

				info = '60m²';
				data = jaap.parse_info(info);
				assert(data.type == '' && data.rooms == undefined && data.area == '60m²');

				info = 'Appartement, 1 kamer, 82m²';
				data = jaap.parse_info(info);
				assert(data.type == 'Appartement' && data.rooms == 1 && data.area == '82m²');

				info = 'Appartement';
				data = jaap.parse_info(info);
				assert(data.type == 'Appartement' && data.rooms == undefined && data.area == '');

				info = '99 kamers';
				data = jaap.parse_info(info);
				assert(data.type == '' && data.rooms == 99 && data.area == '');
				assert(typeof data.rooms == 'number');
			});
		});
	});

	// ————————————————————

	describe('lib/scraping.js', function() {
		var cheerio = require('cheerio');
		var scraping = require('../lib/scraping.js');

		describe(f('#query()'), function() {
			it('should work with css and jquery', function() {
				var html = ' \
					<div id="container"> \
						<div class="div">div</div> \
						<span>span</span> \
					</div>';
				var $ = cheerio.load(html);
				var query, result;

				query = '$("#container div").first()';
				result = scraping.query('jquery', query, html);
				assert(result.text().trim() == 'div');

				query = '#container span';
				result = scraping.query('css', query, html);
				assert(result.text().trim() == 'span');
			});
		});
	});

	// ————————————————————

	describe('blocks/digest.js', function() {
		var digest = require('../blocks/digest.js');

		// describe(f('#()'), function() {
		// 	it('should', function() {
		// 		var tick = tasklib.load_block('tick');
		// 		var run = tasklib.create_step(tick, {}, {});
		// 		run('input', {});
		// 		run('input', {});
		// 		run('input', {});
		// 	});
		// });

		describe(f('#parse_time()'), function() {
			it('should parse time', function() {
				var parsed;
				parsed = helper.parse_time('12 minutes');
				assert(parsed.minutes === 12);

				parsed = helper.parse_time('12 minutes ago');
				assert(_.isEmpty(parsed));
			});
		});

		// describe(f('#()'), function() {
		// 	it('should', function() {
		// 		var task_path = path.join(global.paths.root, 'tasks/test/digest-test-2.json');
		// 		var task = tasklib.load_task_from_file(task_path);
		// 		task = tasklib.prepare_task(task);
		// 		tasklib.run_task(task);
		// 	});
		// });
	});

});
