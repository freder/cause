'use strict';

var _ = require('lodash');
var sf = require('sf');
var chalk = require('chalk');
var feed = require('./feed.js');


function fn(task, step, input, prev_step, done) {
	var cause = this;

	// construct rss feed url
	var query = step.options.search.replace(/ +/ig, '+');
	step.options.url = sf('http://www.ebay.{1}/sch/i.html?_nkw={0}&_rss=1', query, step.options.tld);

	// wrap original callback
	var cb = _.wrap(done, function(done, err, output, decision) {
		// do s.th. with output from `feed` block
		output.forEach(function(item) {
			console.log(item.title);
			console.log('\t', chalk.green(item.link));
		});
		// pass arguments on to original callback
		done(err, output, decision);
	});

	// use `feed` block functionality
	feed.fn.call(this, task, step, input, prev_step, cb);
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			tld: 'de',
			search: 'epson perfection v800'
		},
		data: feed.defaults.data,
		description: 'new ebay search results'
	}
};
