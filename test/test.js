var assert = require('assert');
var path = require('path');
var chalk = require('chalk');
var _ = require('lodash');

var root = path.resolve('./');
console.log(chalk.blue(root));
global.paths = {
	root: root,
	lib: path.join(root, 'lib'),
	blocks: path.join(root, 'blocks')
};


function f(s) {
	return chalk.bgBlue(s);
}


describe('lib/', function() {

	describe('tasklib.js', function() {
		var tasklib = require('../lib/tasklib.js');

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

		describe(f('#load_task()'), function() {
			it("should not create a timer for tasks that don't specify an inteval", function() {
				var task_data, task;

				task_data = {
					name: 'test task',
					steps: [],
					interval: null
				};
				task = tasklib.load_task(task_data);
				assert(task._timer === undefined);

				task_data.interval = false;
				task = tasklib.load_task(task_data);
				assert(task._timer === undefined);

				task_data.interval = 'every 5 seconds';
				task = tasklib.load_task(task_data);
				assert(task._timer);

				assert.throws(function() {
					task_data.interval = 'asdf';
					task = tasklib.load_task(task_data);					
				});

				delete task_data.interval;
				task = tasklib.load_task(task_data);
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
		var hjson = require('hjson');
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

});
