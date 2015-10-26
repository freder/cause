'use strict';

var sf = require('sf');
var path = require('path');
var winston = require('winston');

var debug = require('debug')('cause:lib:'+path.basename(__filename));


function get_by(obj_array, key, value) {
	return obj_array.filter(function(o) {
		return (o[key] === value);
	});
}


function get_first_by(obj_array, key, value) {
	return get_by(obj_array, key, value)[0];
}


function make_googlemaps_url(address, city, country) {
	address = address || '';
	city = city || 'Den Haag';
	country = country || 'Netherlands';
	var q = [
			address.replace(/ +/g, '+'),
			city.replace(/ +/g, '+'),
			country.replace(/ +/g, '+')
		].join(',+');
	return sf('http://www.google.com/maps/place/{0}/', q);
}


module.exports = {
	get_first_by: get_first_by,
	make_googlemaps_url: make_googlemaps_url
};
