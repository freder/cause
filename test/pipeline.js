var FeedParser = require('feedparser');
var request = require('request');
var async = require('async');
var validator = require('validator');
var moment = require('moment');
var fmt = require('simple-fmt');


function req(config, _cb) {
	return function(task, input, cb) {
		do_request(config, _cb(cb));
	};
}


function do_request(config, cb) {
	var test = 'isURL';
	if (!validator[test](config.url)) {
		return cb(new Error('validation failed: '+test));
	}

	return request({
		url: config.url,
		// method: config.method || 'get',
		// json: config.jsop || false,
		// body: config.data || undefined
	}, function(err, res, data) {
		cb(err, data);
	});
}


function parser(_cb) {
	return function(task, input, cb) {
		parse_feed(input, _cb(cb));
	};
}


function parse_feed(data, cb) {
	var feedparser = new FeedParser();
	// feedparser.on('error', helper.handle_error);

	var items = [];
	feedparser.on('readable', function() {
		var article;
		while (article = this.read()) {
			// console.log(article.title);
			items.push(article);
		}
	});

	feedparser.on('meta', function(metadata) {
		// console.log('meta');
	});

	feedparser.on('end', function() {
		cb(null, items);
	});

	feedparser.write(data);
	feedparser.end();
}


function log(format_function, _cb) {
	return function(task, input, cb) {
		console.log( format_function(task, input) );
		_cb(cb)(null, input); // pass through the original input
	}
}


// ————————————————————————————————————

var task = {
	name: 'a series of actions'
};

// returns a function to wrap the waterfall callback with.
// that function injects the `task` object, so that it is passed down, too.
function __cb(task) {
	return function _cb(cb) {
		return function(err, output) {
			cb(err, task, output);
		}		
	}
}
var _cb = __cb(task);

// gets the ball rolling by passing the `task`.
function start(cb) {
	cb = _cb(cb);
	var err = null;
	var output = null
	cb(err, output);
}

var request_feed = req(
	{ url: 'http://www.watchcartoononline.com/anime/adventure-time/feed' },
	_cb
);

var log_response = log(
	function(task, input) {
		return fmt('{0} — response length: {1} bytes', task.name, input.length);
	},
	_cb
);

var log_time = log(
	function(task, input) {
		return moment().format('DD-MM-YYYY, HH:mm:ss');
	},
	_cb
);

var log_feeditems = function(task, input, cb) {
	input.forEach(function(item) {
		console.log(item.title);
	});
	_cb(cb)(null, input);
}

var pipeline = [
	start,
	request_feed,
	log_response,
	parser(_cb),
	log_feeditems,
	log_time
];

async.waterfall(
	pipeline,
	function(err, result) {
		if (err) throw err;
	}
);
