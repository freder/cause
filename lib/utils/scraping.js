'use strict';

var path = require('path');
var cheerio = require('cheerio');
var ua = require('random-useragent');

var debug = require('debug')('cause:lib:'+path.basename(__filename));


function query(method, selector, html) {
	method = method || 'css';

	var $ = cheerio.load(html);
	var $result;

	switch (method) {
		case 'css':
			$result = $(selector);
			break;
		case 'jquery':
			$result = eval(selector);
			break;
		default:
			debug('unknown scraping method: '+method);
			return null;
	}

	return $result;
}


function request_defaults() {
	var defaults = {};
	var user_agent;
	try {
		user_agent = ua.getRandom(function(agent) {
			return agent.browserName.toLowerCase() === 'chrome'
				&& parseFloat(agent.browserVersion) >= 30;
		});
		defaults.headers = { 'User-Agent': user_agent };
	} catch (e) {
		console.error('creating random user agent failed');
		return defaults;
	}

	return defaults;

}

module.exports = {
	query: query,
	request_defaults: request_defaults
};
