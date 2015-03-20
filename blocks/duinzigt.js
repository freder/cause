var path = require('path');
var R = require('ramda');
var _ = require('lodash');
var winston = require('winston');
var request = require('request');
var chalk = require('chalk');
var sf = require('sf');
var FeedParser = require('feedparser');
var validator = require('validator');


var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var realestate = require( path.join(global.paths.lib, 'realestate.js') );
var email = require( path.join(global.paths.lib, 'email.js') );

var debug = require('debug')(path.basename(__filename));


function neighborhood_filter(white_list) {
	return function(item) {
		return R.contains(item.neighborhood.toLowerCase(), white_list);		
	}
}

function city_filter(city) {
	return function(item) {
		return item.city.toLowerCase() == city.toLowerCase();		
	}
}

function price_filter(threshold) {
	return function(item) {
		return parseInt(item.price) <= threshold;		
	}
}


function fn(task, step, input, prev_step) {
	// validation
	if (!validator.isURL(step.options.url)) {
		throw new Error('not a valid url: ' + step.options.url);
	}
	
	var feedparser = new FeedParser();
	feedparser.on('error', helper.handle_error);

	var req_options = {
		url: step.options.url
	};
	var req = request(req_options);
	req.on('error', helper.handle_error);
	req.on('response', function(res) {
		if (res.statusCode != 200) {
			debug('status code: '+res.statusCode, task.name);
			debug(req_options.url);
			feedparser = null;
			return;
		}

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
				var data = R.pick(['rss:street_name', 'rss:price', 'rss:sub_category', 'rss:area', 'rss:city', 'rss:rooms', 'rss:link'], article);
				for (key in data) {
					var new_key = key.replace('rss:', '');
					var value = data[key]['#'];
					delete data[key];

					if (new_key == 'area') new_key = 'neighborhood';
					if (new_key == 'street_name') new_key = 'street';
					if (new_key == 'sub_category') new_key = 'type';

					data[new_key] = value;
				}

				data.maps_url = helper.make_googlemaps_url(data.street);

				if (article['rss:images']) {
					var image_links = article['rss:images']['image_link'];
					if (image_links) {
						if (!_.isArray(image_links)) {
							image_links = [image_links];
						}
						data.images = image_links.map(function(img_link) {
							return img_link['#'];
						});
					}
				}

				new_items[article.guid] = data;
			}
			current_guids.push(article.guid);
		}
	});

	feedparser.on('end', function() {
		// TODO: expose all criteria as options
		var acceptable_neighborhoods = [
			'archipel',
			'centrum',
			'regentessekwartier',
			'statenkwartier',
			'zeeheldenkwartier',
			'willemspark',
			'transvaal',
			'valkenboskwartier'
		];
		var matcher = R.pipe(
			R.filter(city_filter('den haag')),
			R.filter(neighborhood_filter(acceptable_neighborhoods)),
			R.filter(price_filter(1000))
		);
		var matches = matcher( R.values(new_items) );

		var new_ones = (matches.length > 0);

		if (new_ones) {
			var line = sf('{0} {1} new houses', chalk.bgBlue('duinzigt'), matches.length);
			winston.info(line);

			var email_content = realestate.email_template(matches);
			email.send({
				subject: sf('duinzigt: {0} new houses', matches.length),
				html: email_content
			});
		}

		var flow_decision = tasklib.flow_decision(new_ones);
		var output = matches;
		tasklib.invoke_children(step, task, output, flow_decision);

		step.data.seen_guids = current_guids;
		step.data.last_pubdate = meta['pubdate'];
		tasklib.save_task(task);
	});
}


module.exports = {
	fn: fn,
	defaults: {
		options: {},
		data: {
			last_pubdate: null,
			seen_guids: []
		}
	}
};
