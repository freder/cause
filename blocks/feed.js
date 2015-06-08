var path = require('path');
var _ = require('lodash');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var feed = require( path.join(global.paths.lib, 'feed.js') );
var scraping = require( path.join(global.paths.lib, 'scraping.js') );

var debug = require('debug')('cause:block:'+path.basename(__filename));


function fn(task, step, input, prev_step, done) {
	var that = this;

	var req_opts = _.defaults(
		{ url: step.options.url },
		scraping.request_defaults()
	);
	var feedparser = feed.request_feedparser(req_opts);

	feed.process_feed(
		{
			feedparser: feedparser,
			seen_guids: step.data.seen_guids,
			seen_pubdate: step.data.seen_pubdate
		},
		function(err, result) {
			if (err) { return helper.handle_error(err); }

			var output = result.new_items;
			var new_ones = (result.new_items.length > 0);
			done(null, output, new_ones);

			step.data.seen_guids = result.guids;
			step.data.seen_pubdate = result.meta['pubdate'];
			that.save();
		}
	);
}


module.exports = {
	fn: fn,
	defaults: {
		options: {},
		data: {
			seen_pubdate: null,
			seen_guids: []
		},
		description: 'new rss item(s)'
	}
};
