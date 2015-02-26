var path = require('path');
var chalk = require('chalk');
var winston = require('winston');
var _ = require('lodash');
var request = require('request');
var FeedParser = require('feedparser');

var db = require( path.join(global.paths.root, 'db.js') );
var helper = require( path.join(global.paths.lib, 'helper.js') );


function create(task, step) {
	var defaults = {};
	helper.validate_step_options(step, defaults); // TODO: should be a pure function

	var data_defaults = {
		last_pubdate: null,
		seen_guids: []
	};
	helper.validate_step_data(step, data_defaults); // TODO: should be a pure function

	return function(input, prev_step) {
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
					step.data.seen_guids.push(article.guid);
					new_items[article.guid] = data;
				}
			}
		});

		feedparser.on('end', function() {
			// _.each(new_items, function(item) {
			// 	var line = item.title;
			// 	winston.info(line);
			// });

			// if (options.email) {
			// 	var subject = 'feed alert: ' + options.name;
			// 	var content = _.map(new_items, function(item) {
			// 		return '<a href="'+item.link+'">'+item.link+'</a>';
			// 	}).join('<br>');
			// 	email.send(subject, content);
			// }

			var new_items_array = _.values(new_items);
			var new_ones = (new_items_array.length > 0);
			var flow_decision = helper.flow_decision(new_ones);
			var output = new_items_array;
			helper.invoke_children(step, task, output, flow_decision);

			step.data.last_pubdate = meta['pubdate'];
		});
	};
}


module.exports = {
	create: create
};
