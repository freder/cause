'use strict';

var R = require('ramda');
var _ = require('lodash');
var request = require('request');
var chalk = require('chalk');
var sf = require('sf');
var FeedParser = require('feedparser');
var validator = require('validator');


function neighborhood_filter(white_list) {
	return function(item) {
		return R.contains(item.neighborhood.toLowerCase(), white_list);
	};
}

function city_filter(city) {
	return function(item) {
		return item.city.toLowerCase() === city.toLowerCase();
	};
}

function price_filter(min_price, max_price) {
	return function(item) {
		return (min_price <= item.price) && (item.price <= max_price);
	};
}


function rename_keys(data) {
	for (var key in data) {
		var new_key = key.replace('rss:', '');

		// rename some special cases
		if (new_key === 'area') { new_key = 'neighborhood'; }
		if (new_key === 'street_name') { new_key = 'street'; }
		if (new_key === 'sub_category') { new_key = 'type'; }

		data[new_key] = data[key]['#'];

		if (new_key != key) {
			delete data[key]; // delete old entry
		}
	}
	return data;
}


function prepare_item(item) {
	var new_item = R.pick(
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
	new_item = rename_keys(new_item);

	new_item.price = parseInt(new_item.price);
	new_item.source = 'duinzigt';

	// make google maps url
	new_item.maps_url = cause.utils.misc.make_googlemaps_url(new_item.street);

	// prepare images
	if (item['rss:images']) {
		var image_links = item['rss:images']['image_link'];
		if (image_links) {
			if (!_.isArray(image_links)) {
				image_links = [image_links];
			}
			new_item.images = image_links.map(function(img_link) {
				return img_link['#'];
			});
		}
	}

	// duinzigt links could still work, even though the item
	// is not available (listed on the website) anymore.
	new_item._link = new_item.link;
	var search_template = 'http://www.duinzigt.nl/aanbod.php?zoek_adres={0}&button=Zoeken&zoek_objectsoort=0&zoek_buurt=0&zoek_inrichting=6&zoek_minprice=0&zoek_maxprice=100000000&zoek_min_kamers=1&zoek_max_personen=1&button=Zoeken';
	new_item.link = sf(search_template, new_item.street.replace(/ /ig, '+'));

	return new_item;
}


function fn(task, step, input, prev_step, done) {
	var cause = this;

	var feedparser = cause.utils.feed.request_feedparser({
		url: step.options.url
	});

	cause.utils.feed.process_feed(
		{
			feedparser: feedparser,
			seen_guids: step.data.seen_guids,
			seen_pubdate: step.data.seen_pubdate
		},
		function(err, result) {
			if (err) { return done(err); }

			var new_matches = result.new_items
				.map(prepare_item)
				.filter(city_filter('den haag'))
				.filter(neighborhood_filter(step.options.neighborhoods))
				.filter(price_filter(step.options.min_price, step.options.max_price));

			cause.debug(
				sf('{0} items, {1} new ones, {2} matches',
					result.items.length,
					result.new_items.length,
					new_matches.length
				)
			);

			var new_ones = (new_matches.length > 0);

			// if (new_ones) {
				// var line = cause.utils.format.cli_msg('duinzigt', sf('{0} new houses', new_matches.length));
			// 	cause.winston.info(line);

			// 	var email_content = cause.utils.realestate.email_template(new_matches);
			// 	cause.utils.email.send({
			// 		subject: sf('duinzigt: {0} new houses', new_matches.length),
			// 		html: email_content
			// 	});
			// }

			var output = new_matches;

			step.data.seen_guids = result.guids;
			step.data.seen_pubdate = result.meta['pubdate'];
			cause.save();

			done(null, output, new_ones);
		}
	);
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
			max_price: 1000
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
