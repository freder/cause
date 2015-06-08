var path = require('path');
var request = require('request');
var _ = require('lodash');
var ical = require('ical');
var moment = require('moment');
var sf = require('sf');
var validator = require('validator');

var helper = require( path.join(global.paths.lib, 'helper.js') );
var tasklib = require( path.join(global.paths.lib, 'tasklib.js') );
var scraping = require( path.join(global.paths.lib, 'scraping.js') );


function organizer(orga) {
	return orga.params.map(function(item) {
			return item.replace('CN=', '');
		})
		.join(', ');
}


function process_event(e) {
	// console.log(organizer(e.organizer));
	// console.log(e.description.substr(0, 100), '...');
	// console.log(moment(e.start).format());

	e = {
		organizer: organizer(e.organizer),
		summary: e.summary,
		description: e.description,
		location: e.location,
		class: e.class,
		url: e.url,
		start: e.start,
		end: e.end,
	};

	function format_date(d) {
		var format = 'DD-MM-YYYY, HH:mm';
		var m = moment(d);
		if (m.isValid()) {
			return m.format(format);
		} else {
			m = moment(d, 'YYYYMMDD');
			if (m.isValid()) {
				return m.format(format);
			}
		}
		return d;
	}

	var html = sf('<a href="{url}"><h3>{summary}</h3></a>', e);
	html += sf('start: <b>{0}</b><br>', format_date(e.start));
	html += sf('end: <b>{0}</b><br>', format_date(e.end));
	html += sf('{0}', e.description.replace(/\n/ig, '<br>'));
	html += '<hr><br>';
	e.html = html;

	return e;
}


function fn(task, step, input, prev_step, done) {
	var that = this;

	// validation
	if (!validator.isURL(step.options.url)) {
		throw new Error('not a valid url: ' + step.options.url);
	}

	var req_opts = _.defaults(
		{ url: step.options.url },
		scraping.request_defaults()
	);
	var req = request(req_opts, function(err, res, body) {
		if (err) { return helper.handle_error(err); }

		if (res.statusCode != 200) {
			that.debug('status code: '+res.statusCode, task.name);
			that.debug(req_opts.url);
			return;
		}

		var events = ical.parseICS(body);
		var current_events = [];
		var new_items = {};
		_.keys(events).forEach(function(key) {
			if (step.data.seen_events.indexOf(key) < 0) {
				var e = process_event(events[key]);
				new_items[key] = e;
			}
			current_events.push(key);
		});

		var new_items_array = _.values(new_items);
		var new_ones = (new_items_array.length > 0);
		var output = new_items_array;
		done(null, output, new_ones);

		step.data.seen_events = current_events;
		that.save();
	});
}


module.exports = {
	fn: fn,
	defaults: {
		options: {},
		data: {
			seen_events: []
		},
		description: "new ical event"
	},
	organizer: organizer
};
