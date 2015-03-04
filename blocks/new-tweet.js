var _ = require('lodash');
var chalk = require('chalk');
var path = require('path');

var config = require( path.join(global.paths.root, 'config.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var twitter = require( path.join(global.paths.lib, 'twitter.js') );


var endpoints = {
	'filter': 'statuses/filter',
	'user': 'user'
};

var endpoint_defaults = {
	'filter': {},
	'user': {
		'with': 'followings'
	}
}

// var parameters = {
// 	'follow': 'follow',
// 	'track': 'track'
// };


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
			endpoint_defaults[endpoint],
			_.pick(step.options, 'track', 'follow')
		);
		var stream = client.stream(endpoint, parameters);

		stream.on('tweet', function(tweet) {
			var text = tweet.text.toLowerCase();

			var keywords = step.options.keywords;
			var matches = keywords
				.filter(function(kw) {
					if (kw.type == 'string') {
						return (text.indexOf(kw.value) > -1);
					}
					else if (kw.type == 'regex') {
						var re = new RegExp(kw.value, kw.flags || '');
						return re.test(text);
					}
					return false;
				});

			if (matches.length > 0) {
				text = chalk.magenta(text);
				console.log('@'+tweet.user.screen_name);
				console.log(text);

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
		endpoint: 'user'
	},
	data_defaults: {}
};
