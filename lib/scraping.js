var cheerio = require('cheerio');


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
	}
	return $result;
}


module.exports = {
	query: query
};
