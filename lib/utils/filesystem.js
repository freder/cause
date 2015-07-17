'use strict';

var fs = require('fs');
var path = require('path');

var debug = require('debug')('cause:lib:'+path.basename(__filename));


function load_json(filepath) {
	var data = fs.readFileSync(filepath).toString();
	try {
		return JSON.parse(data);
	} catch (e) {
		throw new Error('couldn\'t parse JSON');
		// return null;
	}
}


function filename_extension(filepath) {
	var filename = path.basename(filepath);
	var last_index = filename.lastIndexOf('.');
	return {
		name: filename.substr(0, last_index),
		ext: filename.substr(last_index + 1)
	};
}
function get_filename(filepath) {
	return filename_extension(filepath).name;
}
// function get_extension(filepath) {
// 	return filename_extension(filepath).ext;
// }


module.exports = {
	filename_extension: filename_extension,
	get_filename: get_filename,
	load_json: load_json
};
