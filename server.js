var path = require('path');
var winston = require('winston');
var chalk = require('chalk');
var express = require('express');

var config = require( path.join(global.paths.root, 'config.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );


function start() {
	var app = express();
	app.use(express.static(path.join(global.paths.root, 'web')));
	app.set('views', path.join(global.paths.root, 'web/templates'));
	app.set('view engine', 'jade');


	var server = app.listen(config.server.port, function() {
		// var host = server.address().address;
		var host = 'localhost';
		var port = server.address().port;
		winston.info('listening at '+chalk.cyan('http://'+host+':'+port));
	});


	app.get('/', function(req, res) {
		res.render('views/index', { tasks: global.tasks });
	});


	app.post('/run/:taskname', function(req, res) {
		var ok = true;
		var task = helper.get_by_name(global.tasks, req.params.taskname);
		if (!task) ok = false;
		else tasklib.run_task(task);
		res.json({ ok: ok });
	});
}


module.exports = {
	start: start
};
