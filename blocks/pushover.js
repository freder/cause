var pushover = require('pushover-notifications');
var winston = require('winston');
var _ = require('lodash');

var config = require( path.join(global.paths.root, 'config.js') );


var p = new pushover({
	user: config.pushover.user_key,
	token: config.pushover.api_key
});


// https://pushover.net/api
var defaults = {
	// message: '',
	title: 'causality',
	device: config.pushover.device
};


function send(msg) {
	msg = _.defaults(msg, defaults);
	p.send(msg, function(err, result) {
		if (err) throw err;
		winston.debug('sent pushover notification.');
	});
}


module.exports = {
	send: send
};
