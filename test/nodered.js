var _ = require('lodash');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var pushover = require('../node_modules/node-red-node-pushover/57-pushover.js');
var jsfunction = require('../node_modules/node-red/nodes/core/core/80-function.js');


function wrap(nodered_node, options, handlers, input) {
	var options = options || {};
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
				var node = new Constructor(options);
				if (input) node.emit('input', { payload: input });
			},

			createNode: function(node, options) {
				_.extend(node, options);

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

	nodered_node(RED);
}


// pushover(RED);
// jsfunction(RED);

// wrap(pushover, {
// 	credentials: {
// 		pushkey: 'asdf',
// 		deviceid: 'asdf'
// 		// pushkey: options.pushover.api_key,
// 		// deviceid: options.pushover.device
// 	}
// });

wrap(
	jsfunction,
	{ 
		func: 'console.log("success!")'
	},
	{
		handle_input: function(msg) { 
			console.log('in:', msg); 
		},
		handle_output: function(results) { 
			console.log('out:', results); 
		}
	},
	'hello node-red'
);
