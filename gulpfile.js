var gulp = require('gulp');
var mocha = require('gulp-mocha');
var notifier = require('node-notifier');
var path = require('path');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var glob = require('glob');
var fs = require('fs');
var sf = require('sf');
var exec = require('child_process').exec;
var _ = require('lodash');
var gutil = require('gulp-util');
var chalk = require('chalk');
var browserify = require('browserify');
var watchify = require('watchify');
var reactify = require('reactify');
var source = require('vinyl-source-stream');

var filesystem = require('./lib/utils/filesystem.js');


var dirname = {
	public: 'web',
	css: 'css',
	sass: 'sass'
};


paths = {
	css: path.join(__dirname, dirname.public, dirname.css),
	sass: path.join(__dirname, dirname.public, dirname.sass)
};

var pattern = {
	sass: '*.{sass,scss}',
	sass_main: '!(_)*.{sass,scss}'
};

var options = {
	sass: {
		indentedSyntax: true,
		errLogToConsole: true
	},

	autoprefixer: {
		browsers: ['last 2 versions']
	}
};


gulp.task('graphviz', function() {
	function cleanup(s) {
		return s.replace(/ +/g, '-').replace(/\-/g, '_');
	}

	glob(path.join('./tasks/', '*.json'), function(err, files) {
		files.forEach(function(filepath) {
			var task = filesystem.load_json(filepath);
			var basename = filesystem.get_filename(filepath);
			var content = 'digraph '+basename.replace(/\-/, '_')+' {\n';
			var step_definitions = '';
			var connections = '';

			// boilerplate
			content += '\
				edge [\n\
					fontname = Helvetica,\n\
					labelfontsize = 10 ,\n\
					labelfloat = false,\n\
					labelloc = "c",\n\
					minlen = 2,\n\
					len = 2.5\n\
				];\n\
				\n\
				node [\n\
					fontname = Helvetica,\n\
					fontsize = 10,\n\
					# shape = circle,\n\
					shape = box,\n\
					# fixedsize = true,\n\
					# width = 1.0,\n\
					style = filled,\n\
					fillcolor = "yellow"\n\
					color = none\n\
				];\n\
				\n\
				rankdir = TB;\n\
				overlap = false;\n\
				#splines = line;\n\
				splines = spline;\n\n';
			
			// task info
			// http://www.graphviz.org/doc/info/attrs.html#k%3aescString
			content += sf('node [labeljust = "l" label = "{name}\\l{interval}\\l" shape = box fillcolor = none color = "gray"]; task_info;\n', task);

			task.steps.forEach(function(step) {
				// node
				var node_name = cleanup(step.id);
				step_definitions += sf('node [label = "{0}\\n({1}.js)" shape = box color = none fillcolor = "yellow"]; {2};\n', step.id, step.block, node_name);
				
				// edges
				var flow = step.flow;
				flow.if = flow.if || [];
				flow.else = flow.else || [];
				flow.always = flow.always || [];
				['if', 'else', 'always'].forEach(function(type) {
					if (flow[type].length > 0) {
						var flow_node = sf('{0}_{1}', node_name, type);
						step_definitions += sf('node [label = "{0}" shape = diamond color = none fillcolor = "gray"]; {1};\n', type, flow_node);
						connections += sf('{0} -> {1} [ minlen = 1.0 ];\n', node_name, flow_node);
					}
					flow[type].forEach(function(next) {
						connections += sf('{0} -> {1};\n', flow_node, cleanup(next));
					});
				});
			});

			content += step_definitions+'\n';
			content += connections+'\n';
			content += '}\n';
			var output_dir = './graphviz/';
			var gv_file = path.join(output_dir, basename+'.gv');
			fs.writeFileSync(gv_file, content);

			var cmd = sf("dot -T {ext} '{gv_file}' > '{basename}.{ext}'", {
				ext: 'pdf',
				gv_file: gv_file,
				basename: path.join(output_dir, basename)
			});
			console.log(cmd);
			exec(cmd);
		});
	});

});


gulp.task('sass', function() {
	return gulp.src( path.join(paths.sass, pattern.sass_main) )
		.pipe(sass(options.sass))
		.pipe(autoprefixer(options.autoprefixer))
		.pipe(
			gulp.dest( path.join(paths.css) )
		);
});


var main_js_file_path = './web/js/index.js';
var destination_path = './web/js';
var destination_filename = '_bundle.js';
 
// build scripts with browserify
gulp.task('build:js', function() {
	return browserify({
			transform: [reactify]
		})
		.add(main_js_file_path)
		.bundle()
		.on('error', function(e) {
			gutil.log('Browserify Error', e);
		})
		.pipe(source(destination_filename))
		.pipe(gulp.dest(destination_path));
});
 
// watch scripts & build with debug features
gulp.task('watch:js', function() {
	var b = browserify(
			_.defaults({
				transform: [reactify]
			}, watchify.args)
		)
		.add(main_js_file_path);
 
	var w = watchify(b)
		.on('update', function(scriptIds) {
			scriptIds = scriptIds
				.filter(function(i) { return i.substr(0,2) !== './'; })
				.map(function(i) { return chalk.blue(i.replace(__dirname, '')); });
			if (scriptIds.length > 1) {
				gutil.log(scriptIds.length + ' Scripts updated:\n* ' + scriptIds.join('\n* ') + '\nrebuilding...');
			} else {
				gutil.log(scriptIds[0] + ' updated, rebuilding...');
			}
 
			rebundle();
		})
		.on('time', function(time) {
			gutil.log(chalk.green('Scripts built in ' + (Math.round(time / 10) / 100) + 's'));
		});
 
	function rebundle() {
		w.bundle()
			.on('error', function(e) {
				gutil.log('Browserify Error', e);
			})
			.pipe(source(destination_filename))
			.pipe(gulp.dest(destination_path));
	}
 
	return rebundle();
});


gulp.task('build', ['sass', 'build:js']);

gulp.task('default', ['sass', 'watch:js'], function() {
	gulp.watch('./web/sass/**/*.{sass,scss}', ['sass']);
});
