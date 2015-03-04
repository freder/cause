var path = require('path');
var chalk = require('chalk');
var winston = require('winston');
var _ = require('lodash');
var request = require('request');
var FeedParser = require('feedparser');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );


function fn(task, step, input, prev_step) {
	var feedparser = new FeedParser();
	feedparser.on('error', helper.handle_error);

	var req_options = {
		url: step.options.url
	};
	var req = request(req_options);
	req.on('error', helper.handle_error);
	req.on('response', function(res) {
		res.pipe(feedparser);
	});

	var meta;
	var current_guids = [];
	var new_items;
	feedparser.on('meta', function(metadata) {
		meta = metadata;
		new_items = {};
	});

	feedparser.on('readable', function() {
		if (meta['pubdate'] == step.data.last_pubdate) {
			return;
		}

		var article;
		while (article = this.read()) {
			if (step.data.seen_guids.indexOf(article.guid) === -1) {
				var data = _.pick(article, 'title', 'link');
				new_items[article.guid] = data;
			}
			current_guids.push(article.guid);
		}
	});

	feedparser.on('end', function() {
		var new_items_array = _.values(new_items);
		var new_ones = (new_items_array.length > 0);
		var flow_decision = tasklib.flow_decision(new_ones);
		var output = new_items_array;
		tasklib.invoke_children(step, task, output, flow_decision);

		step.data.seen_guids = current_guids;
		step.data.last_pubdate = meta['pubdate'];
		tasklib.save_task(task);
	});
}


module.exports = {
	fn: fn,
	defaults: {},
	data_defaults: {
		last_pubdate: null,
		seen_guids: []
	}
};
