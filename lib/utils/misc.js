'use strict';


const makeGoogleMapsURL = module.exports.makeGoogleMapsURL =
function makeGoogleMapsURL(address='', city='', country='') {
	const query = [
		address.replace(/ +/g, '+'),
		city.replace(/ +/g, '+'),
		country.replace(/ +/g, '+')
	].join(',+');
	return `http://www.google.com/maps/place/${query}/`
};
