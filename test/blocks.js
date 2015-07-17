var assert = require('assert');
var path = require('path');
var chalk = require('chalk');
var async = require('async');
var _ = require('lodash');

var util = require('./util.js');

var tasklib = require('../lib/tasklib.js');

var jaap = require('../blocks/jaap.js');
var duinzigt = require('../blocks/duinzigt.js');
var digest = require('../blocks/digest.js');


describe(util.f1('blocks/'), function() {

	// ############################################################
	describe(util.f2('jaap.js'), function() {

		describe(util.f3('.parse_info()'), function() {
			it('should work with inconsistent data', function() {
				var info;
				var data;

				info = '';
				data = jaap.parse_info(info);
				assert(data.type == undefined && data.rooms == undefined && data.area == undefined);

				info = 'Appartement, 60m²';
				data = jaap.parse_info(info);
				assert(data.type == 'Appartement' && data.rooms == undefined && data.area == '60m²');

				info = 'Appartement, 1 kamer';
				data = jaap.parse_info(info);
				assert(data.type == 'Appartement' && data.rooms == 1 && data.area == undefined);

				info = '2 kamers, 60m²';
				data = jaap.parse_info(info);
				assert(data.type == undefined && data.rooms == 2 && data.area == '60m²');

				info = '60m²';
				data = jaap.parse_info(info);
				assert(data.type == undefined && data.rooms == undefined && data.area == '60m²');

				info = 'Appartement, 1 kamer, 82m²';
				data = jaap.parse_info(info);
				assert(data.type == 'Appartement' && data.rooms == 1 && data.area == '82m²');

				info = 'Appartement';
				data = jaap.parse_info(info);
				assert(data.type == 'Appartement' && data.rooms == undefined && data.area == undefined);

				info = '99 kamers';
				data = jaap.parse_info(info);
				assert(data.type == undefined && data.rooms == 99 && data.area == undefined);
				assert(typeof data.rooms == 'number');
			});
		});

		describe(util.f3('.text_filter()'), function() {
			it('should reject houses for less than 2 persons', function(done) {
				// var opts = {
				// 	url: 'http://www.jaap.nl/te-huur/x/x/x/x/x/14953138/overzicht/'
				// };
				// jaap.do_request(opts, function(err, body) {
				// 	if (err) { throw err; }

				// 	var $ = cheerio.load(body);
				// 	var $description = $('.long-description');
				// 	var result = jaap.text_filter($description.text());
				// 	assert(result === false);

				// 	done();
				// });

				var texts = [
					'nope',
					'Gehele woning is v.v. een laminaat vloer, raambedekking, verlichting en er kan gebruik worden gemaakt van de gezamenlijke wasmachine & droger middels muntsyteem. Geschikt voor 1 persoon! Het appartement kan in overleg ook eerder gehuurd worden.',
					'no matches here'
				];
				var filtered = texts.filter(jaap.text_filter);
				// console.log(filtered);
				assert(filtered.length === 2);
				assert(filtered.indexOf('nope') > -1);
				assert(filtered.indexOf('no matches here') > -1);

				done();
			});
		});
	});


	// ############################################################
	describe(util.f2('duinzigt.js'), function() {

		describe(util.f3('.rename_keys()'), function() {
			it('should remove "rss:" and rename special cases', function() {
				var item = {
					'rss:city': { '#': 'den haag'},
					'rss:area': { '#': 'zeeheldenkwartier'},
					'street_name': { '#': 'fake street'}
				};
				var result = duinzigt.rename_keys(item);
				assert(result.city == 'den haag');
				assert(result.neighborhood == 'zeeheldenkwartier');
				assert(result.street == 'fake street');
			});
		});

		describe(util.f3('.{city,neighborhood,price}_filter()'), function() {
			it('should work', function() {
				var items = [
					{ city: 'amsterdam', price: 750, neighborhood: 'zeeheldenkwartier' },
					{ city: 'den haag', price: 1200, neighborhood: 'zeeheldenkwartier' },
					{ city: 'den haag', price: 800, neighborhood: 'zeeheldenkwartier' },
					{ city: 'den haag', price: 800, neighborhood: 'bad neighborhood' }
				];
				var result = items
					.filter(duinzigt.price_filter(400, 1000))
					.filter(duinzigt.city_filter('den haag'))
					.filter(duinzigt.neighborhood_filter(['zeeheldenkwartier']))
					;
				assert(result.length === 1);
			});
		});

	});


	// ############################################################
	describe(util.f2('digest.js'), function() {
		// describe(util.f3('.()'), function() {
		// 	it('should', function() {
		// 		var task_path = path.join('../', 'tasks/test/digest-test-2.json');
		// 		var task = tasklib.load_task_from_file(task_path);
		// 		task = tasklib.prepare_task(task);
		// 		tasklib.run_task(task);
		// 	});
		// });


		// describe(util.f3('.fn()'), function() {
		// 	it('should ignore falsey input', function() {
		// 		var digest = tasklib.load_block('digest');
		// 		var task = {};
		// 		var step = {};
		// 		var run = tasklib.create_step_function(digest, task, step);
		// 		var input = null;
		// 		run(input, {});
		// 	});
		// });

		describe(util.f3('.fn()'), function() {
			it('should flush when saturated', function() {
				var digest = tasklib.load_block('digest');
				var task = {};
				var step = {
					options: {
						limit: 3,
						// at_least: 1,
						// or_after: false
					}
				};
				var run = tasklib.create_step_function(digest, task, step);

				var callback_counter = 0;
				var done = function(err, output) {
					// console.log(output);
					callback_counter++;
				};

				run('input', {}, done);
				run('input', {}, done);
				run('input', {}, done);

				run('input', {}, done);
				run('input', {}, done);
				run('input', {}, done);

				run('input', {}, done);

				assert(callback_counter === 2);
			});
		});

		describe(util.f3('.fn()'), function() {
			it('should obey "at_least" option', function() {
				var digest = tasklib.load_block('digest');
				var task = {};
				var step = {
					options: {
						limit: 1,
						at_least: 2,
						// or_after: false
					}
				};
				var run = tasklib.create_step_function(digest, task, step);

				var callback_counter = 0;
				var done = function(output) {
					// console.log(output);
					callback_counter++;
				};

				run('input', {}, done);
				run('input', {}, done);
				run('input', {}, done);

				assert(callback_counter === 1);
			});
		});

		describe(util.f3('.fn()'), function() {
			it('should flush all at once, when "limit" is succeeded', function() {
				var digest = tasklib.load_block('digest');
				var task = {};
				var step = {
					options: {
						limit: 2
					}
				};
				var run = tasklib.create_step_function(digest, task, step);

				var input = ['input', 'input', 'input', 'input', 'input'];
				var cb = function(err, output) {
					assert(output.length === input.length);
				};
				run(input, {}, cb);
			});
		});

		// describe(util.f3('.fn()'), function() {
		// 	it('should obey "or_after" option', function(done) {
		// 		var digest = tasklib.load_block('digest');
		// 		var task = {};
		// 		var step = {
		// 			options: {
		// 				limit: 999,
		// 				at_least: 1,
		// 				or_after: '1 seconds'
		// 			}
		// 		};
		// 		var run = tasklib.create_step_function(digest, task, step);

		// 		var cb = function(output) {
		// 			clearInterval(id);
		// 			// console.log(output);
		// 			// console.log(output.length);
		// 			assert(output.length === 2);
		// 			done();
		// 		};

		// 		var counter = 0;
		// 		var id = setInterval(function() {
		// 			counter++;
		// 			run(counter, {}, cb);
		// 		}, 800);
		// 	});
		// });
	});


	// ############################################################
	describe(util.f2('tick.js'), function() {
		// describe(util.f3('.()'), function() {
		// 	it('should', function() {
		// 		var tick = tasklib.load_block('tick');
		// 		var run = tasklib.create_step_function(tick, {}, {});
		// 		run('input', {});
		// 		run('input', {});
		// 		run('input', {});
		// 	});
		// });

		describe(util.f3('validation'), function() {
			it('should validate input / data / options', function() {
				var tick = tasklib.load_block('tick');
				var task = {};
				var step = { data: { counter: '12' } };
				var prev_step = {};

				var run = tasklib.create_step_function(tick, task, step);

				assert.throws(function() {
					run('input', prev_step);
				});

				step.data.counter = 12;
				run('input', prev_step);
			});
		});
	});


	// ############################################################
	describe(util.f2('multi-threshold.js'), function() {
		describe(util.f3('.fn()'), function() {
			it('should work up', function() {
				var multithresh = tasklib.load_block('multi-threshold');
				var task = {};
				var step = {
					options: {
						offset: 0,
						step: 1
					},
					data: {
						prev_value: 0.6
					}
				};
				var run = tasklib.create_step_function(multithresh, task, step);
				var counter = 0;

				async.eachSeries([0.6, 1.1],
					function(value, callback) {
						run(value, {}, function(err, output) {
							assert(output.down === false);
							if (counter === 0) assert(output.up === false);
							if (counter === 1) assert(output.up === true);
							counter++;
							callback(null);
						});
					}
				);
			});

			it('should work down', function() {
				var multithresh = tasklib.load_block('multi-threshold');
				var task = {};
				var step = {
					options: {
						offset: 0,
						step: 1
					},
					data: {
						prev_value: 0.6
					}
				};
				var run = tasklib.create_step_function(multithresh, task, step);
				var counter = 0;

				async.eachSeries([0.6, -0.3],
					function(value, callback) {
						run(value, {}, function(err, output) {
							assert(output.up === false);
							if (counter === 0) assert(output.down === false);
							if (counter === 1) assert(output.down === true);
							counter++;
							callback(null);
						});
					}
				);
			});

			it('should obey the "offset"', function() {
				var multithresh = tasklib.load_block('multi-threshold');
				var task = {};
				var step = {
					options: {
						offset: 0.5,
						step: 1
					},
					data: {
						prev_value: 0.6
					}
				};
				var run = tasklib.create_step_function(multithresh, task, step);
				var counter = 0;

				async.eachSeries([0.6, 0.4],
					function(value, callback) {
						run(value, {}, function(err, output) {
							if (counter === 1) assert(output.down === true);
							counter++;
							callback(null);
						});
					}
				);
			});

			it('should work with arbitrary "step" sizes', function() {
				var multithresh = tasklib.load_block('multi-threshold');
				var task = {};
				var step = {
					options: {
						offset: 0.799098,
						step: 10.2345345
					}
				};
				var threshold = step.options.offset + (3 * step.options.step);
				var values = [threshold+0.1, threshold-0.1];
				step.data = { prev_value: values[0] };

				var run = tasklib.create_step_function(multithresh, task, step);
				var counter = 0;

				async.eachSeries(values,
					function(value, callback) {
						run(value, {}, function(err, output) {
							if (counter === 1) assert(output.down === true);
							counter++;
							callback(null);
						});
					}
				);
			});
		});
	});


	// ############################################################
	describe(util.f2('js-function.js'), function() {
		describe(util.f3('.fn()'), function() {
			it('should work', function(cb) {
				var jsfun = tasklib.load_block('js-function');
				var task = {};
				var step = {
					options: {
						func: 'function() { output = 999; }'
					}
				};
				var prev_step = {};
				var run = tasklib.create_step_function(jsfun, task, step);
				var input = 123;

				run(input, prev_step, function(err, output) {
					assert(output === 999);
					cb();
				});
			});
		});
	});

});
