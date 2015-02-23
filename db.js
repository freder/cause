var lowdb = require('lowdb');
var path = require('path');
var config = require( path.join(global.paths.root, 'config.js') );


function get_by(obj_array, key, value) {
	return obj_array.filter(function(o) {
		return (o[key] == value);
	});
}


function get_all_by_name(array, name) {
	return get_by(array, 'name', name);
}

function get_by_name(array, name) {
	return get_all_by_name(array, name)[0];
}


lowdb.mixin({
	get_all_by_name: get_all_by_name,
	get_by_name: get_by_name,
	get_by: get_by
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
