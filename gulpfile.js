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


var root = path.resolve('./');
global.paths = {
	root: root,
	lib: path.join(root, 'lib'),
	blocks: path.join(root, 'blocks')
};
var helper = require('./lib/helper.js');
var tasklib = require('./lib/tasklib.js');
var filesystem = require('./lib/filesystem.js');


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


gulp.task('default', [/*'mocha',*/ 'sass'], function() {
	// gulp.watch([
	// 		'./*.js',
	// 		'./lib/*.js',
	// 		'./blocks/*.js',
	// 		'./test/*.js'
	// 	],
	// 	['mocha']
	// );

	gulp.watch('./web/sass/**/*.{sass,scss}', ['sass']);
});
