var path = require('path');
var winston = require('winston');
var chalk = require('chalk');
var express = require('express');
var open = require('open');
var sf = require('sf');

var config = require( path.join(global.paths.root, 'config.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var utils = require( path.join(global.paths.lib, 'utils.js') );

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
	debug('opening '+url+' in browser')
	open(url);
}


function start() {
	var app = express();
	app.use(express.static(path.join(global.paths.root, 'web')));
	app.set('views', path.join(global.paths.root, 'web/templates'));
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
		});
	});


	app.post('/run/:slug', function(req, res) {
		var ok = true;
		var task = utils.misc.get_first_by(global.tasks, 'slug', req.params.slug);
		if (!task) ok = false;
		else tasklib.run_task(task);
		res.json({ ok: ok });
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
