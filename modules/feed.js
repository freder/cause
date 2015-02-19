var FeedParser = require('feedparser');
var request = require('request');
var winston = require('winston');
var _ = require('lodash');

var helper = require('../helper.js');
var email = require('../email.js');


function create(options) {
	var last_pubdate = null;
	var seen = {};
	var new_items = {};

	return function() {
		var req = request(options.url, {});
		req.on('error', helper.handle_error);

		var feedparser = new FeedParser();
		feedparser.on('error', helper.handle_error);

		// --
		req.on('response', function(res) {
			res.pipe(feedparser);
		});
		// --

		var meta;
		var updated = true;
		feedparser.on('readable', function() {
			if (meta['pubdate'] == last_pubdate) {
				return;
			}

			var article;
			while (article = this.read()) {
				if (!(article.guid in seen)) {
					var data = _.pick(article, 'title', 'link');
					seen[article.guid] = data;
					new_items[article.guid] = data;
				}
			}
		});

		feedparser.on('meta', function(metadata) {
			meta = metadata;
			new_items = {};
		});

		feedparser.on('end', function() {
			last_pubdate = meta['pubdate'];

			_.each(new_items, function(item) {
				var line = item.title;
				winston.info( helper.module_log_format(line, options) );
			});

			if (options.email) {
				var subject = 'feed alert: ' + options.name;
				var content = _.map(new_items, function(item) {
					return '<a href="'+item.link+'">'+item.link+'</a>';
				}).join('<br>');
				email.send(subject, content);
			}
		});
	};
}


module.exports = function(options) {
	return create(options);
};
