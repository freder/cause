var lowdb = require('lowdb');
var path = require('path');

var config = require( path.join(global.paths.root, 'config.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );


lowdb.mixin({
	get_all_by_name: helper.get_all_by_name,
	get_by_name: helper.get_by_name,
	get_by: helper.get_by
});


function get() {
	var db_path = path.join(global.paths.root, config.db.path);
	var settings = {
		autosave: false, // automatically save on change
		async: false // async write
	};
	return lowdb(db_path, settings);
}


// modules are cached
var database = get();
module.exports = database;
