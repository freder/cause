var util = require('util');
var _ = require('lodash');
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var later = require('later');
var request = require('request');
var FeedParser = require('feedparser');
var split = require('split');
var through2 = require('through2');
var lowdb = require('lowdb');

var nopt = require('nopt');
var opts = {
	// "foo" : [String, null],
	// "bar" : [Stream, Number],
	// "baz" : path,
	// "bloo" : [ "big", "medium", "small" ],
	// "flag" : Boolean,
	// "pick" : Boolean,
	// "many" : [String, Array]
};
var shorthands = {
	// "foofoo" : ["--foo", "Mr. Foo"],
	// "b7" : ["--bar", "7"],
	// "m" : ["--bloo", "medium"],
	// "p" : ["--pick"],
	// "f" : ["--flag"]
};
var argv = nopt(opts, shorthands, process.argv);
// console.log(argv);


var schedule = later.parse.recur().every(10).second();
// var next10 = later.schedule(schedule).next(10);
var timer = later.setInterval(function() {
	console.log('hehe');
}, schedule);


function handle_error(err) {
	util.error(chalk.red(err));
}

process.on('uncaughtException', function(err) {
	handle_error(err)
	process.exit(1);
});

process.on('SIGINT', function () {
	// TODO: clean up
	console.info('\n');
	console.info(chalk.yellow('exiting...'));
	process.exit();
});


var db = lowdb('db.json', {
	autosave: true, // automatically save on change
	async: true // async write
});
db('posts').push({ title: 'lowdb is awesome' });
db('posts').find({ title: 'lowdb is awesome' });


// var seen = {};
// feedparser.on('readable', function() {
// 	var stream = this;
// 	var article;
// 	while (article = stream.read()) {
// 		var time = article.date.getTime();
// 		if (!(article.guid in seen) || (seen[article.guid] !== 0 && seen[article.guid] != time)) {
// 			seen[article.guid] = article.date ? time : 0;
// 		}
// 	}
// });



// var transform_json = through2.obj(
// 	function(line, enc, cb) {
// 		line = line.replace(/^module.exports * = * /, '');
// 		line = line.replace(/[ \t]*[;]$/, '');
// 		this.push(line);
// 		cb();
// 	}
// );

// var transform_format = through2.obj(
// 	function(line, enc, cb) {
// 		console.log(line);
// 		this.push(line);
// 		cb();
// 	}
// );


// fs.createReadStream('test.txt')
// 	.on('error', handle_error)
// 	.pipe(split())
// 	.pipe(transform_json)
// 	.pipe(transform_format);
