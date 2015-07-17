'use strict';

var Twit = require('twit');
var chalk = require('chalk');


var endpoints = {
	// https://dev.twitter.com/streaming/reference/post/statuses/filter
	'filter': 'statuses/filter',

	// https://dev.twitter.com/streaming/reference/post/statuses/sample
	'sample': 'statuses/sample',

	// https://dev.twitter.com/streaming/userstreams
	'user': 'user'
};

var endpoint_defaults = {
	'filter': {},

	'sample': {},

	'user': {
		// https://dev.twitter.com/streaming/overview/request-parameters#with
		'with': 'followings'
	}
};

// var parameters = {
// 	'follow': 'follow',
// 	'track': 'track'
// };


function create_client(credentials) {
	var client = new Twit(credentials);
	return client;
}


function remove_at_mentions(text) {
	return text.replace(/(@\w+)/ig);
}


function print_tweet(tweet) {
	console.log('@'+tweet.user.screen_name);
	console.log(chalk.magenta(tweet.text));
}


function keyword_filter(text, kw) {
	if (kw.type === 'string') {
		return (text.indexOf(kw.value) > -1);
	}
	else if (kw.type === 'regex') {
		var re = new RegExp(kw.value, kw.flags || '');
		return re.test(text);
	}
	return false;
}


module.exports = {
	create_client: create_client,
	remove_at_mentions: remove_at_mentions,
	print_tweet: print_tweet,
	keyword_filter: keyword_filter,
	endpoints: endpoints,
	endpoint_defaults: endpoint_defaults
};
