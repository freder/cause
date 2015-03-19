var cheerio = require('cheerio');
var path = require('path');


var debug = require('debug')(path.basename(__filename));


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

	if ($result.length === 0) {
		throw 'selection is empty';
	}
	return $result;
}


module.exports = {
	query: query
};
