var es = require('event-stream');


var data = es.readable(function(count, cb) {
	// console.log(count);
	this.emit('data', {
		a: 123,
		'b': "1234"
	});
	this.emit('end');
	cb();
});

var alter = es.through(function write(data) {
	// console.log(data, typeof data);
	this.emit('data', data.a);
});

var print = es.through(function write(data) {
	console.log(data, typeof data);
	this.emit('data', data);
});

data
	.pipe(alter)
	.pipe(print)
	;




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
// 	.on('error', helper.handle_error)
// 	.pipe(split())
// 	.pipe(transform_json)
// 	.pipe(transform_format);
