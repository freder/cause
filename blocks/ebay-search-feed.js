'use strict';

const chalk = require('chalk');
const causeFeed = require('cause-feed');


function fn(input, step, context, done) {
	// construct rss feed url
	const query = step.options.search.replace(/ +/ig, '+');
	step.options.url = `http://www.ebay.${step.options.tld}/sch/i.html?_nkw=${query}&_rss=1`;

	// use `causeFeed` block functionality
	causeFeed.fn(input, step, context, (err, output, decision) => {
		// output from `causeFeed` block
		const input = output;

		if (!output) {
			done(new Error('no input received'));
		}

		input.forEach((item) => {
			console.log(item.title);
			console.log('\t', chalk.green(item.link));
		});

		// pass arguments on to callback
		done(err, output, decision);
	});
}


module.exports = {
	fn: fn,
	defaults: {
		options: {
			tld: 'de',
			search: 'epson perfection v800'
		},
		data: causeFeed.defaults.data,
		description: 'new ebay search results'
	}
};
