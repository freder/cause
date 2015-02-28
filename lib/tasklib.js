var _ = require('lodash');
var later = require('later');
var moment = require('moment');
var winston = require('winston');
var path = require('path');
// var uuid = require('node-uuid');

var db = require( path.join(global.paths.root, 'db.js') );
var config = require( path.join(global.paths.root, 'config.js') );


function make_savable(task) {
	// don't persist anything prefixed with '_'
	return _.omit(task, function(value, key, object) {
		return (key[0] === '_');
	});
}


module.exports = {
	make_savable: make_savable
};
