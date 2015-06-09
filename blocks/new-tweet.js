var _ = require('lodash');
var R = require('ramda');


// TODO: more functionality
var fn = function(task, step, input, prev_step, done) {
	var that = this;

	var endpoint = step.options.endpoint;
	var endpoint_path = that.twitter.endpoints[endpoint];

	var parameters = _.extend(
		that.twitter.endpoint_defaults[endpoint],
		_.pick(step.options, 'track', 'follow', 'locations'/*, 'delimited', 'stall_warnings'*/)
	);

	var client = that.twitter.create_client({
		consumer_key: that.config.twitter.api_key,
		consumer_secret: that.config.twitter.api_secret,
		access_token: that.config.twitter.access_token,
		access_token_secret: that.config.twitter.access_token_secret
	});

	var stream = client.stream(endpoint_path, parameters);

	function end(tweet) {
		that.twitter.print_tweet(tweet);
		var output = tweet;
		done(null, output, null);
	}

	stream.on('tweet', function(tweet) {
		var keywords = step.options.keywords;
		if (!!keywords) {
			// clean up tweet text a bit for further processing
			var text = tweet.text.toLowerCase();
			text = that.twitter.remove_at_mentions(text);

			var matches = keywords.filter( R.curry(that.twitter.keyword_filter, text) );

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
