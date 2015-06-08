var _ = require('lodash');


function fn(task, step, input, prev_step, done) {
	var that = this;

	var req_opts = _.defaults(
		{ url: step.options.url },
		that.scraping.request_defaults()
	);
	var feedparser = that.feed.request_feedparser(req_opts);

	that.feed.process_feed(
		{
			feedparser: feedparser,
			seen_guids: step.data.seen_guids,
			seen_pubdate: step.data.seen_pubdate
		},
		function(err, result) {
			if (err) { return that.handle_error(err); }

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
