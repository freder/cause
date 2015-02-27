var winston = require('winston');
var moment = require('moment');


function init() {
	winston.remove(winston.transports.Console);
	winston.add(winston.transports.Console, {
		timestamp: function() {
			// return moment().format('DD-MM-YYYY, HH:mm:ss');
			return moment().format('DD-MM HH:mm');
		},
		colorize: true
	});
}


module.exports = {
	init: init
};
