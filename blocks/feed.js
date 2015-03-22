var path = require('path');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var feed = require( path.join(global.paths.lib, 'feed.js') );

var debug = require('debug')('cause:block:'+path.basename(__filename));


function fn(task, step, input, prev_step) {
	var feedparser = feed.request_feedparser({
		url: step.options.url
	});

	feed.process_feed({
		feedparser: feedparser,
		seen_guids: step.data.seen_guids,
		seen_pubdate: step.data.seen_pubdate
	},
	function(err, result) {
		if (err) { return helper.handle_error(err); }

		var new_ones = (result.new_items.length > 0);
		var flow_decision = tasklib.flow_decision(new_ones);
		var output = result.new_items;
		tasklib.invoke_children(step, task, output, flow_decision);

		step.data.seen_guids = result.guids;
		step.data.seen_pubdate = result.meta['pubdate'];
		tasklib.save_task(task);
	});
}


module.exports = {
	fn: fn,
	defaults: {
		options: {},
		data: {
			seen_pubdate: null,
			seen_guids: []
		}
	}
};
