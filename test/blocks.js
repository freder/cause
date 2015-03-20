var assert = require('assert');
var path = require('path');
var chalk = require('chalk');
var _ = require('lodash');


var util = require('./util.js');
global.paths = util.get_paths();


var tasklib = require('../lib/tasklib.js');

var jaap = require('../blocks/jaap.js');
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
				assert(data.type == '' && data.rooms == undefined && data.area == '');

				info = 'Appartement, 60m²';
				data = jaap.parse_info(info);
				assert(data.type == 'Appartement' && data.rooms == undefined && data.area == '60m²');

				info = 'Appartement, 1 kamer';
				data = jaap.parse_info(info);
				assert(data.type == 'Appartement' && data.rooms == 1 && data.area == '');

				info = '2 kamers, 60m²';
				data = jaap.parse_info(info);
				assert(data.type == '' && data.rooms == 2 && data.area == '60m²');

				info = '60m²';
				data = jaap.parse_info(info);
				assert(data.type == '' && data.rooms == undefined && data.area == '60m²');

				info = 'Appartement, 1 kamer, 82m²';
				data = jaap.parse_info(info);
				assert(data.type == 'Appartement' && data.rooms == 1 && data.area == '82m²');

				info = 'Appartement';
				data = jaap.parse_info(info);
				assert(data.type == 'Appartement' && data.rooms == undefined && data.area == '');

				info = '99 kamers';
				data = jaap.parse_info(info);
				assert(data.type == '' && data.rooms == 99 && data.area == '');
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
	describe(util.f2('digest.js'), function() {
		// describe(util.f1('.()'), function() {
		// 	it('should', function() {
		// 		var task_path = path.join(global.paths.root, 'tasks/test/digest-test-2.json');
		// 		var task = tasklib.load_task_from_file(task_path);
		// 		task = tasklib.prepare_task(task);
		// 		tasklib.run_task(task);
		// 	});
		// });
	});


	// ############################################################
	describe(util.f2('tick.js'), function() {
		// describe(util.f1('.()'), function() {
		// 	it('should', function() {
		// 		var tick = tasklib.load_block('tick');
		// 		var run = tasklib.create_step(tick, {}, {});
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

				var run = tasklib.create_step(tick, task, step);

				assert.throws(function() {
					run('input', prev_step);
				});

				step.data.counter = 12;
				run('input', prev_step);
			});
		});
	});

});