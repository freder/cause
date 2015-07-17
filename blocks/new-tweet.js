'use strict';

var _ = require('lodash');
var R = require('ramda');


// TODO: more functionality
var fn = function(task, step, input, prev_step, done) {
	var cause = this;

	var endpoint = step.options.endpoint;
	var endpoint_path = cause.utils.twitter.endpoints[endpoint];

	var parameters = _.extend(
		cause.utils.twitter.endpoint_defaults[endpoint],
		_.pick(step.options, 'track', 'follow', 'locations'/*, 'delimited', 'stall_warnings'*/)
	);

	var client = cause.utils.twitter.create_client({
		consumer_key: cause.config.twitter.api_key,
		consumer_secret: cause.config.twitter.api_secret,
		access_token: cause.config.twitter.access_token,
		access_token_secret: cause.config.twitter.access_token_secret
	});

	var stream = client.stream(endpoint_path, parameters);

	function end(tweet) {
		cause.utils.twitter.print_tweet(tweet);
		var output = tweet;
		done(null, output, null);
	}

	stream.on('tweet', function(tweet) {
		var keywords = step.options.keywords;
		if (!!keywords) {
			// clean up tweet text a bit for further processing
			var text = tweet.text.toLowerCase();
			text = cause.utils.twitter.remove_at_mentions(text);

			var matches = keywords.filter( R.curry(cause.utils.twitter.keyword_filter, text) );

			if (matches.length > 0) {
				end(tweet);
			}
		} else {
			end(tweet);
		}
	});
};


module.exports = {
	fn: fn,
	defaults: {
		options: {
			endpoint: 'user',
			keywords: []
		},
		data: {},
		description: "new tweet"
	}
};
