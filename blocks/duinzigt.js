var path = require('path');
var R = require('ramda');
var winston = require('winston');
var request = require('request');
var chalk = require('chalk');
var sf = require('sf');
var FeedParser = require('feedparser');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var email = require( path.join(global.paths.lib, 'email.js') );



function area_filter(white_list) {
	return function(item) {
		return R.contains(item.area.toLowerCase(), white_list);		
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
	var feedparser = new FeedParser();
	feedparser.on('error', helper.handle_error);

	var req_options = {
		url: step.options.url
	};
	var req = request(req_options);
	req.on('error', helper.handle_error);
	req.on('response', function(res) {
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
				var data = R.pick(['rss:street_name', 'rss:price', 'rss:area', 'rss:city', 'rss:rooms', 'rss:link'], article);
				for (key in data) {
					var new_key = key.replace('rss:', '');
					var value = data[key]['#'];
					delete data[key];
					data[new_key] = value;
				}
				new_items[article.guid] = data;
			}
			current_guids.push(article.guid);
		}
	});

	feedparser.on('end', function() {
		var acceptable_areas = [
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
			R.filter(area_filter(acceptable_areas)),
			R.filter(price_filter(1000))
		);
		var matches = matcher( R.values(new_items) );

		var new_ones = (matches.length > 0);

		if (new_ones) {
			var line = sf('{0} {1} new houses', chalk.bgBlue('duinzigt'), matches.length);
			winston.info(line);

			var email_content = '';
			matches.forEach(function(match) {
				var txt = '<br><hr>';

				var maps_url = sf('http://www.google.com/maps/place/{0},+Den+Haag,+Netherlands/', match.street_name.replace(/ +/g, '+'));
				var street_link = sf('<a href="{0}">{1}</a>', maps_url, match.street_name);
				txt += sf('{0}<br>', street_link);

				txt += sf('area: {0}<br>', match.area);
				txt += sf('price: {0} EUR<br>', match.price);
				txt += sf('rooms: {0} EUR<br>', match.rooms);

				var info_link = sf('<a href="{0}">more info</a>', match.link);
				txt += sf('{0}<br>', info_link);
				txt += '<br>';

				email_content += txt;
			});
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
