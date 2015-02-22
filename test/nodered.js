var _ = require('lodash');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
// var config = require('../config.js');
var pushover = require('../node_modules/node-red-node-pushover/57-pushover.js');
var jsfunction = require('../node_modules/node-red/nodes/core/core/80-function.js');


function wrap(module, config, handlers, input) {
	var config = config || {};
	var input = input || null;
	
	var handlers = handlers || {};
	handlers.handle_input = handlers.handle_input || function(msg) {
		console.log('input:', msg);
	};
	handlers.handle_output = handlers.handle_output || function(results) {
		console.log('output:', results);
	};

	// fake RED object: https://github.com/node-red/node-red/blob/master/red/red.js
	var RED = {
		version: function() { return 'fake'; },

		settings: {},

		library: {
			register: function() {}
		},

		nodes: {
			registerType: function(name, Constructor) {
				util.inherits(Constructor, EventEmitter);
				var node = new Constructor(config);
				if (input) node.emit('input', { payload: input });
			},

			createNode: function(node, config) {
				_.extend(node, config);

				node.error = function(err_msg) {
					// console.log(err_msg);
				};

				node.metric = function() {};

				// capture input
				node.on('input', handlers.handle_input);

				// capture output
				node.send = handlers.handle_output;
			}
		}
	};

	module(RED);
}


// pushover(RED);
// jsfunction(RED);

// wrap(pushover, {
// 	credentials: {
// 		pushkey: 'asdf',
// 		deviceid: 'asdf'
// 		// pushkey: config.pushover.api_key,
// 		// deviceid: config.pushover.device
// 	}
// });

wrap(
	jsfunction,
	{ func: 'console.log("success!")' },
	{
		handle_input: function(msg) { console.log('in:', msg); },
		handle_output: function(results) { console.log('out:', results); }
	},
	'hello node-red'
);
