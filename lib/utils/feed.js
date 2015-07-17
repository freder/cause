'use strict';

var path = require('path');
var _ = require('lodash');
var request = require('request');
var FeedParser = require('feedparser');
var validator = require('validator');

var handle_error = require('./misc.js').handle_error;
var debug = require('debug')('cause:lib:'+path.basename(__filename));


function do_request(req_opts) {
	return request(req_opts)
		.on('error', handle_error);
}


function request_feedparser(req_opts) {
	if (!validator.isURL(req_opts.url)) {
		throw new Error('not a valid url: ' + req_opts.url);
	}

	var feedparser = new FeedParser();
	feedparser.on('error', handle_error);

	var req = do_request(req_opts);
	req.on('response', function(res) {
		if (res.statusCode != 200) {
			debug('status code: '+res.statusCode, task.name);
			debug(req_opts.url);
			return;
		}
		res.pipe(feedparser);
	});

	return feedparser;
}


function process_feed(opts, done) {
	var feedparser = opts.feedparser;

	var meta;
	var new_items;
	feedparser.on('meta', function(metadata) {
		meta = metadata;
		new_items = {};
	});

	var guids = [];
	var all_items = [];
	feedparser.on('readable', function() {
		if (!_.isEmpty(meta['pubdate']) && meta['pubdate'] === opts.seen_pubdate) {
			return;
		}

		var item;
		while (item = this.read()) {
			if (meta['#type'] === 'rss') {
				// TODO: rename keys
			}

			if (opts.seen_guids.indexOf(item.guid) === -1) {
				new_items[item.guid] = item;
			}
			guids.push(item.guid);
			all_items.push(item);
		}
	});

	feedparser.on('end', function() {
		done(null, {
			meta: meta,
			guids: guids,
			items: all_items,
			new_items: _.values(new_items)
		});
	});
}


module.exports = {
	request_feedparser: request_feedparser,
	process_feed: process_feed,
	do_request: do_request
};
