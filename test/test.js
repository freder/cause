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
			it('should remove everything prefixed with \'_\'', function() {
				var task = {
					name: 'test task',
					_internal: 'schedule'
				};
				var savable = tasklib.make_savable(task);
				assert(savable._internal === undefined);
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

		describe(f('#validate_step_flow()'), function() {
			it('should make sure everything is sane', function() {
				var _flow, flow;
				
				_flow = {};
				flow = tasklib.validate_step_flow(_flow);
				assert(flow['if'] !== undefined);

				_flow = 'test';
				flow = tasklib.validate_step_flow(_flow);
				assert(flow['if'] !== undefined);

				_flow = null;
				flow = tasklib.validate_step_flow(_flow);
				assert(flow['if'] !== undefined);
				assert(_.isArray(flow['if']));

				_flow = {
					'if': 'asdf'
				};
				flow = tasklib.validate_step_flow(_flow);
				assert(flow['if'] !== undefined);
			});
		});
	});

});