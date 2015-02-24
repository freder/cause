var FeedParser = require('feedparser');
var request = require('request');
var _ = require('lodash');
var hl = require('highland');
var es = require('event-stream');


var print = es.through(function write(data) {
	console.log(data.title);
	this.emit('data', data);
});

var feedparser = new FeedParser();
console.log(feedparser, typeof feedparser);

request.get('http://www.watchcartoononline.com/anime/adventure-time/feed')
	.pipe(feedparser)
	.pipe(print);
