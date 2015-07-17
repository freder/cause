'use strict';

var async = require('async');
var sf = require('sf');
var cheerio = require('cheerio');
var request = require('request');
var R = require('ramda');
var _ = require('lodash');


// TODO: cleaner re-write
// - rate limit requests
// - https://github.com/fent/timequeue.js
/*
make a queue
for each neighborhood
	queue(first page)
		look at all items on page
		if already seen
			return
		if end of page
			if there is a next page
				queue(next page)

*/

var timeout = 500;

var price_min = 400;
var price_max = 1000;
var price_range = sf('{0}-{1}', price_min, price_max);

var sort = 'sort4'; // new to old
var page = 1;


function text_filter(description) {
	// "geschikt voor 1 persoon"
	// "geschikt voor twee personen"
	// etc.

	var re = /geschikt voor ([\d\w]+) \w+/i;
	var result = re.exec(description);

	// if (result !== null) {
	// 	console.log(result/*[1]*/);
	// }

	return !(result !== null);
}


// TODO: expose all criteria as options
var neighborhoods = [
		'archipelbuurt',
		'centrum',
		'regentessekwartier',
		'geuzen- en statenkwartier',
		'zeeheldenkwartier',
		'willemspark',
		'transvaalkwartier',
		'valkenboskwartier'
	].map(function(neighborhood) {
		return neighborhood
			.toLowerCase()
			.replace(/ +/g, '+');
	});


function make_url(_data) {
	var data = {
		// neighborhood: neighborhood,
		price_range: price_range,
		sort: sort,
		page: page
	};
	data = _.extend({}, data, _data);
	var url = sf("http://www.jaap.nl/huurhuizen/zuid+holland/agglomeratie+'s-gravenhage/'s-gravenhage/{neighborhood}/{price_range}/{sort}/p{page}", data);
	return url;
}


function make_link(id) {
	return sf('http://www.jaap.nl/te-huur/x/x/x/x/x/{0}/', id);
}


function parse_info(info) {
	var items = info.split(',');

	var type = undefined;
	var rooms = undefined;
	var area = undefined;

	items.forEach(function(item) {
		item = item.trim();

		if (item.indexOf('m²') > -1) {
			area = (item === '') ? undefined : item;
		} else if (/^\d+ kamer/.test(item)) {
			rooms = item.split(' ')[0];
			rooms = parseInt(rooms);
		} else {
			type = (item === '') ? undefined : item;
		}
	});

	return {
		type: type,
		rooms: rooms,
		area: area
	};
}


function do_request(req_opts, cb) {
	req_opts = _.defaults(
		req_opts,
		cause.utils.scraping.request_defaults()
	);
	return request(
		req_opts,
		function(err, res, body) {
			if (err) { return cb(err); }

			if (res.statusCode != 200) {
				var msg = 'status code: '+res.statusCode;
				cause.debug(msg, task.name);
				cause.debug(req_opts.url);
				return cb(new Error(msg));
			}

			cb(null, body);
		}).on('error', function(err) {
			console.log(err);
		});
}


function get_number_of_pages(done) {
	var funs = neighborhoods.map(function(neighborhood) {
		var opts = {
			url: make_url({ neighborhood: neighborhood }),
			timeout: 30*1000 // 30 seconds
		};

		return function(result, cb) {
			do_request(opts, function(err, body) {
				if (err) { return cb(err); }

				var $ = cheerio.load(body);
				var $pageinfo = $('.page-info');
				var num_pages = $pageinfo.first().text().trim().split(' van ')[1];
				result[neighborhood] = parseInt(num_pages);

				cb(null, result);
			});
		}
	});

	async.waterfall(
		[ function(cb) { cb(null, {}); } ].concat(funs),
		function(err, result) {
			if (err) throw err;
			done(result);
		});
}


function get_items_from_page(body, kill_cb, step) {
	var $ = cheerio.load(body);
	var $items = $('.property-list .property');

	var collected = [];
	$items.each(function(index, el) {
		var $this = $(this);

		if (!$this.attr('id') || $this.hasClass('.bottom-navigation')) return;

		// images
		var images = [];
		$this.find('.property-photos img').each(function() {
			var src = $(this).attr('src');
			if (src != '/Content/images/Redesign/jaap_img_placeholder.png') {
				images.push( $(this).attr('src') );
			}
		});

		var $features = $this.find('.property-features .property-feature');
		var info = _.compact([
			$features.eq(0).text(),
			$features.eq(1).text(),
			$features.eq(2).text()
		]).join(', ').replace('ᵐ', 'm').replace(/ +/g, ' ');
		info = parse_info(info);

		var price = $this.find('.property-price').text().replace('€', '').trim();
		price = parseInt(price);

		var item = {
			source: 'jaap.nl',
			id: $this.attr('id').split('_')[2],
			street: $this.find('.property-address-street').text(),
			images: images,
			type: info.type,
			rooms: info.rooms,
			area: info.area,
			price: price
		};

		item.street = item.street.replace(' 0 Ong', '');
		item.link = make_link(item.id);
		item.maps_url = cause.utils.misc.make_googlemaps_url(item.street);

		step.data.temp_seen_ids.push(item.id);
		if (step.data.seen_ids.indexOf(item.id) < 0) {
			collected.push(item);
			// step.data.seen_ids.push(item.id);
		} /*else {
			// kill queue for this neighborhood after this page
			kill_cb();
		}*/
	});

	return collected;
}


function scrape(done, step) {
	get_number_of_pages(function(neighborhood_num) {

		// for each neighborhood
		var funs = _.keys(neighborhood_num).map(function(neighborhood) {
			var num_pages = neighborhood_num[neighborhood];

			return function(result, cb_neighborhood) {
				var kill = false;
				var kill_cb = function() { kill = true; };
				var page = 1;

				async.until(
					// test
					function() { return kill || (page === num_pages+1); },

					// for each page
					function(cb) {
						var url = make_url({ neighborhood: neighborhood, page: page });
						var opts = { url: url };

						// cause.debug( sf('{0}: {1} / {2}', neighborhood, page, num_pages) );

						setTimeout(function() {
							do_request(opts, function(err, body) {
								if (err) { cb_neighborhood(err); }

								var items = get_items_from_page(body, kill_cb, step);
								items.forEach(function(item) {
									// plus to space
									item.neighborhood = neighborhood.replace(/\+/g, ' ');
								});
								result = result.concat(items);
								page++;
								cb();
							});
						}, timeout); // throttle requests a bit
					},

					// callback
					function() {
						cb_neighborhood(null, result);
					}
				);
			};
		});

		async.waterfall(
			[ function(cb) { cb(null, []); } ].concat(funs),
			function(err, result) {
				if (err) throw err;
				done(result);
			});
	});
}


function fn(task, step, input, prev_step, done) {
	var cause = this;

	step.data.temp_seen_ids = [];

	scrape(function(new_items) {
		// some additional filtering first:
		var filtered = new_items
			.filter(function(item) { // we want more than one room
				if (!item.rooms || item.rooms > 1) {
					return true;
				} else {
					return false;
				}
			})
			.filter(function(item) { // no single rooms
				if (item.type || /kamer/i.test(item.type)) {
					return false;
				} else {
					return true;
				}
			});


		// house should be suitable for more than one person
		async.filterSeries(
			filtered,

			function filter(item, cb) {
				var opts = {
					url: item.link
				};
				do_request(opts, function(err, body) {
					if (err) { return cb(err); }

					var $ = cheerio.load(body);
					var $description = $('#long-description');
					var result = text_filter($description.text());
					cb(result);
				});
			},

			function done(new_matches) {
				finish(new_items, new_matches);
			}
		);


		function finish(new_items, new_matches) {
			var new_ones = (new_matches.length > 0);

			// if (new_ones) {
				// var line = cause.utils.format.cli_msg('jaap.nl', sf('{0} new houses', new_matches.length));
			// 	cause.winston.info(line);

			// 	var email_content = cause.utils.realestate.email_template(new_matches);
			// 	var to = cause.config.email.to; // override email defaults
			// 	if (step.options.email && step.options.email.to) {
			// 		to = step.options.email.to;
			// 	}

			// 	cause.utils.email.send({
			// 		to: to,
			// 		subject: sf('jaap.nl: {0} new houses', new_matches.length),
			// 		html: email_content
			// 	});
			// }

			cause.debug(
				sf('{0} new ones, {1} matches',
					new_items.length,
					new_matches.length
				)
			);

			var output = new_matches;

			step.data.seen_ids = _.uniq(step.data.temp_seen_ids);
			delete step.data.temp_seen_ids;
			cause.save();

			done(null, output, new_ones);
		}
	}, step);
}


module.exports = {
	fn: fn,
	defaults: {
		options: {},
		data: {
			seen_ids: []
		},
		description: "jaap.nl"
	},
	parse_info: parse_info,
	do_request: do_request,
	text_filter: text_filter
};
