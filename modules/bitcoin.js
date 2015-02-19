var request = require('request');
var chalk = require('chalk');
var winston = require('winston');
var versus = require('versus');

var helper = require('../helper.js');
var email = require('../email.js');


// https://api.bitcoinaverage.com/exchanges/EUR
/*bitcoin_de: {
	display_URL: "https://bitcoin.de",
	display_name: "Bitcoin.de",
	rates: {
		ask: 212.08,
		bid: 212.08,
		last: 212.08
	},
	source: "cache",
	volume_btc: 531.46,
	volume_percent: 11.15
}*/

// https://api.bitcoinaverage.com/ticker/global/EUR
/*{
	24h_avg: 214,
	ask: 211.06,
	bid: 210.6,
	last: 210.81,
	timestamp: "Wed, 18 Feb 2015 17:42:17 -0000",
	volume_btc: 4766.17,
	volume_percent: 5.05
}*/


function create(options) {
	return function() {
		var req_options = {
			url: 'https://api.bitcoinaverage.com/exchanges/EUR',
			json: true
		};
		request(req_options, function(err, response, body) {
			if (err) {
				helper.handle_error(err);
				return;
			}

			var market = body[options.market];
			var price = market.rates.last;
			var line = market.display_name+': '+chalk.green(price);
			winston.info( helper.module_log_format(line, options) );

			if (options.threshold && versus(price, options.threshold_comparison, options.threshold)) {

				if (options.threshold_email) {
					var subject = 'bitcoin alert: ' + price;
					var content = ':)';
					email.send(subject, content);
				}
			}
		});
	};
}


module.exports = function(options) {
	return create(options);
};
