var path = require('path');
var winston = require('winston');
var express = require('express');

var config = require( path.join(global.paths.root, 'config.js') );
var db = require( path.join(global.paths.root, 'db.js') );


var app = express();
app.use(express.static(path.join(global.paths.root, 'web')));
app.set('views', path.join(global.paths.root, 'web/templates'));
app.set('view engine', 'jade');


var server = app.listen(config.server.port, function() {
	// var host = server.address().address;
	var host = 'localhost';
	var port = server.address().port;
	winston.info('listening at http://'+host+':'+port);
});


app.get('/', function (req, res) {
	var tasks = db.object['tasks'];
	res.render('views/index', { tasks: tasks });
});


module.exports = app;
