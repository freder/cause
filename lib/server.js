'use strict';

var path = require('path');
var winston = require('winston');
var chalk = require('chalk');
var express = require('express');
var open = require('open');
var Hook = require('hook-stdio');

var cwd = process.cwd();
var config = require(path.join(cwd, 'config.js'));
var libPath = path.join(cwd, config.paths.lib);

var tasklib = require(path.join(libPath, 'tasklib.js'));
var utils = require(path.join(libPath, 'utils.js'));

var debug = require('debug')('cause:'+path.basename(__filename));


var app, server;


function get_url() {
	if (!server) {
		debug('can\'t get address: server not running.');
		return;
	} else {
		// var host = server.address().address;
		var host = 'localhost';
		return 'http://'+host+':'+config.server.port;
	}
}


function open_browser() {
	var url = get_url();
	debug('opening '+url+' in browser');
	open(url);
}


function start() {
	app = express();
	app.use(express.static(path.join(cwd, 'web')));
	app.set('views', path.join(cwd, 'web/templates'));
	app.set('view engine', 'jade');


	server = app.listen(config.server.port, function() {
		winston.info('listening at '+chalk.cyan( get_url() ));
	});


	app.get('/', function(req, res) {
		var obj = {};
		global.tasks.forEach(function(t) {
			obj[t.name] = tasklib.make_savable(t, true);
		});
		var json = JSON.stringify(obj);

		res.render('views/index', {
			tasks_json: json,
			websocket_port: config.server.websocket_port
		});
	});


	app.post('/run/:slug', function(req, res) {
		var ok = true;
		var task = utils.misc.get_first_by(global.tasks, 'slug', req.params.slug);
		if (!task) { ok = false; }
		else { tasklib.run_task(task); }
		res.json({ ok: ok });
	});


	// websockets
	var io = require('socket.io').listen(config.server.websocket_port);
	debug('websocket on port', config.server.websocket_port);

	io.sockets.on('connection', function(socket) {
		function redirect(data) {
			socket.emit('console_data', chalk.stripColor(data));
		}

		/*var unhook = */Hook.stdout(redirect, true);
		/*var unhook = */Hook.stderr(redirect, true);
	});


	if (args['open-frontend']) {
		open_browser();
	}
}


module.exports = {
	start: start,
	get_url: get_url,
	open_browser: open_browser
};
