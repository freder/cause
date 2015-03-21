var assert = require('assert');
var path = require('path');
var fs = require('fs');
var chalk = require('chalk');
var _ = require('lodash');
var glob = require('glob');
var cheerio = require('cheerio');
var FeedParser = require('feedparser');


var util = require('./util.js');
global.paths = util.get_paths();


var config = require('../config.js');
var tasklib = require('../lib/tasklib.js');
var helper = require('../lib/helper.js');
var filesystem = require('../lib/filesystem.js');
var scraping = require('../lib/scraping.js');
var feed = require('../lib/feed.js');

var jaap = require('../blocks/jaap.js');
var digest = require('../blocks/digest.js');


describe(util.f1('lib/'), function() {

	// ############################################################
	describe(util.f2('tasklib.js'), function() {
		describe(util.f3('.make_savable()'), function() {
			it("should remove everything prefixed with '_'", function() {
				var task = {
					name: 'test task',
					_internal: 'schedule'
				};
				var savable = tasklib.make_savable(task);
				assert(savable._internal === undefined);
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
		});

		describe(util.f3('.flow_decision()'), function() {
			it('should leave defaults untouched', function() {
				tasklib.flow_decision(false);
				assert(tasklib.flow_decision_defaults['if'] === true);
				// assert(tasklib.flow_decision_defaults['else'] === true);
				// assert(tasklib.flow_decision_defaults['always'] === true);
			});
		});

		describe(util.f3('.normalize_step_flow()'), function() {
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

		describe(util.f3('.normalize()'), function() {
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


	// ############################################################
	describe(util.f2('helper.js'), function() {

		describe(util.f3('.get_filename()'), function() {
			it('should handle filenames correctly', function() {
				var file;

				file = '../asdf/asdfadf/filename.ext';
				assert.equal(filesystem.get_filename(file), 'filename');
				
				file = 'filename.ext';
				assert.equal(filesystem.get_filename(file), 'filename');
				
				file = 'filename.bla.ext';
				assert.equal(filesystem.get_filename(file), 'filename.bla');
				
				file = '.ext';
				assert.equal(filesystem.get_filename(file), '');

				file = '../.ext';
				assert.equal(filesystem.get_filename(file), '');
			});
		});

		describe(util.f3('.parse_time()'), function() {
			it('should parse time', function() {
				var parsed;
				parsed = helper.parse_time('12 minutes');
				assert(parsed.minutes === 12);

				parsed = helper.parse_time('12 minutes ago');
				assert(_.isEmpty(parsed));
			});
		});
	});

	
	// ############################################################
	describe(util.f2('scraping.js'), function() {

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
				$result = scraping.query('jquery', query, html);
				assert($result.text().trim() == 'div');

				query = '#container span';
				$result = scraping.query('css', query, html);
				assert($result.text().trim() == 'span');

				query = '#nope';
				assert.throws(function() {
					scraping.query('css', query, html);
				});
			});
		});

	});


	// ############################################################
	describe(util.f2('feed.js'), function() {

		describe(util.f3('.process_feed()'), function() {
			it('should work', function(done) {
				var feedparser = new FeedParser();
				fs.createReadStream('test/files/feed.xml')
					.pipe(feedparser);

				feed.process_feed({
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
