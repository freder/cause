var path = require('path');
var cheerio = require('cheerio');
var agents = require('browser-agents');

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
			break;
	}

	return $result;
}


function request_defaults() {
	try { // for some reason this fails from time to time
		var user_agent = agents.random();
	} catch (e) {
		return {};
	}

	return { headers: { 'User-Agent': user_agent } };
};


module.exports = {
	query: query,
	request_defaults: request_defaults
};
