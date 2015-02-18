var request = require('request');
var winston = require('winston');

var helper = require('./helper.js');
var email = require('./email.js');


var url = 'https://api.bitcoinaverage.com/exchanges/EUR';
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
		var options = {
			url: url,
			json: true
		};
		request(options, function(err, response, body) {
			if (err) {
				helper.handle_error(err);
				return;
			}

			var price = body.bitcoin_de.rates.last;
			winston.info(body.bitcoin_de.display_name+': '+price);

			if (options.threshold && price >= options.threshold) {
				var subject = 'bitcoin alert: ' + price;
				var link = ':)';
				email.send(subject, link);
			}
		});
	};
}


module.exports = {
	create: create
};
