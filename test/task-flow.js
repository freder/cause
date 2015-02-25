var helper = require('../lib/helper.js');
var _ = require('lodash');

// var validator = require('validator');

// test._meta = {
// 	input: {
// 		type: String,
// 		specifically: 'url'
// 	},
// 	output: {
// 		type: [Object],
// 		specifically: {
// 			a: String,
// 			b: Number
// 		}
// 	}
// };
// function test(url) {
// 	var _meta = 'inside';
// 	return
// }
// console.log(test._meta);


/*
task: {
	name
	slug/id
	interval
	data (optional data to be persisted in db)
	steps: {
		slug/id: {
			module
			name/description
			config
			data (optional data to be persisted in db)
		}
	},
	flow: {
		id (from): id (to),
		id (from): id (to),
	}
}
*/

/*
get task
	find root steps (no incoming connection)
	[
		'a', 'b'
	]

*/

var modules = {
	'test': {
		create: function(task, step) {
			return function(input) {
				console.log(step.name);
				var output = 123;
				setTimeout(function() {
					var connections = helper.get_by(task.flow, 'from', step.name);
					connections.forEach(function(connection) {
						var step = helper.get_by_name(task.steps, connection.to);
						step.execute(output);
					});
				}, 1000);
			};
		}
	}
};

var tasks = {
	first: { 
		name: 'task',
		steps: [
			{ module: 'test', id: 'a', name: 'a', config: { bla: 'a' } },
			{ module: 'test', id: 'b', name: 'b', config: { bla: 'b' } },
			{ module: 'test', id: 'c', name: 'c', config: { bla: 'c' } },
			{ module: 'test', id: 'd1', name: 'd1', config: { bla: 'd1' } },
			{ module: 'test', id: 'e1', name: 'e1', config: { bla: 'e1' } },

			{ module: 'test', id: 'd2', name: 'd2', config: { bla: 'd2' } },
			{ module: 'test', id: 'e2', name: 'e2', config: { bla: 'e2' } }
		],
		flow: [
			{ from: 'a', to: 'b' },
			{ from: 'b', to: 'c' },

			{ from: 'c', to: 'd1' },
			{ from: 'd1', to: 'e1' },

			{ from: 'c', to: 'd2' },
			{ from: 'd2', to: 'e2' }
		]
	}
};

var task = tasks.first;
task.steps.forEach(function(step) {
	step.execute = modules[step.module].create(task, step);
});
var tos = task.flow.map(function(connection) {
	return connection.to;
});
var root_steps = task.steps.filter(function(step) {
	return tos.indexOf(step.name) === -1;
});
root_steps.forEach(function(root_step) {
	root_step.execute();
});
