var lowdb = require('lowdb');
var config = require('./config.js');


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
	return lowdb(config.db.path, config.db.settings);
}


// modules are cached
var database = get();
module.exports = database;
