var _ = require('lodash');
var R = require('ramda');
var path = require('path');

var config = require( path.join(global.paths.root, 'config.js') );
var twitter = require( path.join(global.paths.lib, 'twitter.js') );


// TODO: more functionality
var fn = (function(task, step) {
	var client = twitter.create_client({
		consumer_key: config.twitter.api_key,
		consumer_secret: config.twitter.api_secret,
		access_token: config.twitter.access_token,
		access_token_secret: config.twitter.access_token_secret
	});

	return function(task, step, input, prev_step, done) {
		var that = this;
		
		var endpoint = step.options.endpoint;
		var endpoint_path = twitter.endpoints[endpoint];

		var parameters = _.extend(
			twitter.endpoint_defaults[endpoint],
			_.pick(step.options, 'track', 'follow', 'locations'/*, 'delimited', 'stall_warnings'*/)
		);

		var stream = client.stream(endpoint_path, parameters);

		function end(tweet) {
			twitter.print_tweet(tweet);
			var output = tweet;
			done(null, output, null);
		}

		stream.on('tweet', function(tweet) {
			var keywords = step.options.keywords;
			if (!!keywords) {
				// clean up tweet text a bit for further processing
				var text = tweet.text.toLowerCase();
				text = twitter.remove_at_mentions(text);

				var matches = keywords.filter( R.curry(twitter.keyword_filter, text) );

				if (matches.length > 0) {
					end(tweet);
				}
			} else {
				end(tweet);
			}		
		});
	};
})();


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
