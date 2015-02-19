var lowdb = require('lowdb');

var config = require('./config.js');


function get() {
	return lowdb(config.db.path, config.db.settings);
}
var database = get();

// modules are cached
module.exports = database;
