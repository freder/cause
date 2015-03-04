var gulp = require('gulp');
var mocha = require('gulp-mocha');
var notifier = require('node-notifier');


gulp.task('mocha', function() {
	return gulp.src('test/test.js', { read: false })
		.pipe(mocha())
		.on('error', function(err) {
			notifier.notify({
				title: err.plugin,
				message: err.message
			});
		});
});


gulp.task('default', ['mocha'], function() {
	gulp.watch([
			'./*.js',
			'./lib/*.js',
			'./blocks/*.js',
			'./test/*.js'
		],
		['mocha']
	);
});
