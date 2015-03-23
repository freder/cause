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
var feed = require( path.join(global.paths.lib, 'feed.js') );
var email = require( path.join(global.paths.lib, 'email.js') );

var debug = require('debug')('cause:block:'+path.basename(__filename));


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

function price_filter(min_price, max_price) {
	return function(item) {
		return (min_price <= item.price) && (item.price <= max_price);
	}
}


function rename_keys(data) {
	for (key in data) {
		var new_key = key.replace('rss:', '');

		// rename some special cases
		if (new_key == 'area') new_key = 'neighborhood';
		if (new_key == 'street_name') new_key = 'street';
		if (new_key == 'sub_category') new_key = 'type';

		data[new_key] = data[key]['#'];

		if (new_key != key) {
			delete data[key]; // delete old entry
		}
	}
	return data;
}


function prepare_item(item) {
	var data = R.pick(
		[
			'rss:street_name',
			'rss:price',
			'rss:sub_category',
			'rss:area',
			'rss:city',
			'rss:rooms',
			'rss:link'
		], item
	);

	// remove the 'rss:' part
	data = rename_keys(data);

	data.price = parseInt(data.price);

	// make google maps url
	data.maps_url = helper.make_googlemaps_url(data.street);

	// prepare images
	if (item['rss:images']) {
		var image_links = item['rss:images']['image_link'];
		if (image_links) {
			if (!_.isArray(image_links)) {
				image_links = [image_links];
			}
			data.images = image_links.map(function(img_link) {
				return img_link['#'];
			});
		}
	}

	return data;
}


function fn(task, step, input, prev_step) {
	var feedparser = feed.request_feedparser({
		url: step.options.url
	});

	feed.process_feed({
		feedparser: feedparser,
		seen_guids: step.data.seen_guids,
		seen_pubdate: step.data.seen_pubdate
	},
	function(err, result) {
		if (err) { return helper.handle_error(err); }

		var new_matches = result.new_items
			.map(prepare_item)
			.filter(city_filter('den haag'))
			.filter(neighborhood_filter(step.options.neighborhoods))
			.filter(price_filter(step.options.min_price, step.options.max_price));

		debug(
			sf('{0} items, {1} new ones, {2} matches',
				result.items.length,
				result.new_items.length,
				new_matches.length
			)
		);

		var new_ones = (new_matches.length > 0);

		// if (new_ones) {
		// 	var line = sf('{0} {1} new houses', chalk.bgBlue('duinzigt'), new_matches.length);
		// 	winston.info(line);

		// 	var email_content = realestate.email_template(new_matches);
		// 	email.send({
		// 		subject: sf('duinzigt: {0} new houses', new_matches.length),
		// 		html: email_content
		// 	});
		// }

		var flow_decision = tasklib.flow_decision(new_ones);
		var output = new_matches;
		tasklib.invoke_children(step, task, output, flow_decision);

		step.data.seen_guids = result.guids;
		step.data.seen_pubdate = result.meta['pubdate'];
		tasklib.save_task(task);
	});
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			url: 'http://www.duinzigt.nl/xml/aanbod.php',
			city: 'den haag',
			neighborhoods: [
				'archipel',
				'centrum',
				'regentessekwartier',
				'statenkwartier',
				'zeeheldenkwartier',
				'willemspark',
				'transvaal',
				'valkenboskwartier'
			],
			min_price: 0,
			min_price: 1000
		},
		data: {
			seen_pubdate: null,
			seen_guids: []
		},
		description: "duinzigt.nl"
	},

	rename_keys: rename_keys,
	price_filter: price_filter,
	city_filter: city_filter,
	neighborhood_filter: neighborhood_filter
};
