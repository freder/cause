var crypto = require('crypto');
var cheerio = require('cheerio');
var request = require('request');


function create(task, step) {
	var defaults = {
		selector: 'body'
	};
	helper.validate_step_options(step, defaults);

	var data_defaults = {
		prev_hash: ''
	};
	helper.validate_step_data(step, data_defaults);

	return function(input, prev_step) {
		var req_options = {
			url: step.options.url
		};
		request(req_options, function(err, response, body) {
			if (err) {
				return helper.handle_error(err);
			}

			var $ = cheerio.load(body);
			var html = $(selector).html;

			var hash = crypto
				.createHash('md5')
				.update(html)
				.digest('hex');

			var output = input;
			step.data.prev_hash = hash;

			var changed = (hash !== prev_hash);			
			var flow_decision = helper.flow_decision(changed);
			helper.invoke_children(step, task, output, flow_decision);
		});
	};
}


module.exports = {
	create: create
};
