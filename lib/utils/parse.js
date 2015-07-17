'use strict';

var path = require('path');
var debug = require('debug')('cause:lib:'+path.basename(__filename));


function time(s) {
	// "12 minutes"

	var parsed = {};
	var tokens = s.split(' ');

	if (tokens.length > 2) {
		debug("can't recognize format: " + s);
	} else {
		parsed[tokens[1]] = parseInt(tokens[0]);
	}
	return parsed;
}


module.exports = {
	time: time,
};
