var _ = require('lodash');
var R = require('ramda');
var path = require('path');

var config = require( path.join(global.paths.root, 'config.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var twitter = require( path.join(global.paths.lib, 'twitter.js') );


// TODO: more functionality
var fn = (function(task, step) {
	var client = twitter.create_client({
		consumer_key: config.twitter.api_key,
		consumer_secret: config.twitter.api_secret,
		access_token: config.twitter.access_token,
		access_token_secret: config.twitter.access_token_secret
	});

	return function(task, step, input, prev_step) {
		var endpoint = step.options.endpoint;
		var parameters = _.extend(
			twitter.endpoint_defaults[endpoint],
			_.pick(step.options, 'track', 'follow')
		);
		var stream = client.stream(endpoint, parameters);

		stream.on('tweet', function(tweet) {
			// clean up tweet text a bit for further processing
			var text = tweet.text.toLowerCase();
			text = twitter.remove_at_mentions(text);

			var keywords = step.options.keywords;
			var matches = keywords.filter( R.curry(twitter.keyword_filter, text) );

			if (matches.length > 0) {
				twitter.print_tweet(tweet);
				var output = tweet;
				var flow_decision = tasklib.flow_decision_defaults;
				tasklib.invoke_children(step, task, output, flow_decision);
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
		data: {}
	}
};
