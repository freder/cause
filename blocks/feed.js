'use strict';

var _ = require('lodash');


function fn(task, step, input, prev_step, done) {
	var cause = this;

	var req_opts = _.defaults(
		{ url: step.options.url },
		cause.utils.scraping.request_defaults()
	);
	var feedparser = cause.utils.feed.request_feedparser(req_opts);

	cause.utils.feed.process_feed(
		{
			feedparser: feedparser,
			seen_guids: step.data.seen_guids,
			seen_pubdate: step.data.seen_pubdate
		},
		function(err, result) {
			if (err) { return done(err); }

			var output = result.new_items;
			var new_ones = (result.new_items.length > 0);
			done(null, output, new_ones);

			step.data.seen_guids = result.guids;
			step.data.seen_pubdate = result.meta['pubdate'];
			cause.save();
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
