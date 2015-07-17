var $ = require('jquery');
var _ = require('lodash');
var io = require('socket.io-client');

var React = require('react');
var App = require('./App.js');


function init_codemirror() {
	// var elems = document.querySelectorAll('.codemirror');
	// for (var i = 0; i < elems.length; i++) {
	// 	var editor = CodeMirror(function(cm_el) {
	// 			elems[i].parentNode.replaceChild(cm_el, elems[i]);
	// 		},
	// 		{
	// 			value: elems[i].value,
	// 			mode: 'javascript',
	// 				json: true,
	// 			theme: 'monokai',
	// 			//- lineNumbers: true,
	// 			styleActiveLine: true
	// 		}
	// 	);
	// 	//- console.log(editor.getValue());
	// }
}


function init_websocket() {
	var socket = io('http://localhost:'+websocket_port);

	socket.on('connect', function() {
		console.log('CONNECT');
	});

	socket.on('console_data', function(data) {
		// var $console = $('#console');
		// $console.append( $('<div>'+data+'</div>') )
		// $console.scrollTop($console[0].scrollHeight);

		var method = 'log';
		if (/\d\d i: /.test(data)) method = 'log';
		if (/\d\d w: /.test(data)) method = 'warn';
		if (/\d\d e: /.test(data)) method = 'error';
		var style = 'background-color: black; color: white; font-size: 16px; padding: 3px;';
		console[method]('%c'+data, style);
	});

	socket.on('disconnect', function() {
		console.log('DISCONNECT');
	});
}


$(document).ready(function() {
	init_websocket();

	// init_codemirror();

	React.render(<App tasks={window.tasks} />, $('#app')[0]);
});
