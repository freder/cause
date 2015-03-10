var gulp = require('gulp');
var mocha = require('gulp-mocha');
var notifier = require('node-notifier');


var glob = require('glob');
var fs = require('fs');
var path = require('path');
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
gulp.task('graphviz', function() {
	glob(path.join('./tasks/', '*.json'), function(err, files) {
		files.forEach(function(filepath) {
			var task = helper.load_json(filepath);
			var basename = helper.get_filename(filepath);
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
overlap = false;\n\
#splines = line;\n\
splines = spline;\n\n';

			task.steps.forEach(function(step) {
				// node
				var node_name = step.id.replace(/\-/, '_');
				step_definitions += sf('node [label = "{0}" shape = box fillcolor = "yellow"]; {0};\n', node_name);
				
				// edges
				var flow = step.flow;
				flow.if = flow.if || [];
				flow.else = flow.else || [];
				flow.anyway = flow.anyway || [];
				['if', 'else', 'anyway'].forEach(function(type) {
					if (flow[type].length > 0) {
						var flow_node = sf('{0}_{1}', node_name, type);
						step_definitions += sf('node [label = "{0}" shape = diamond fillcolor = "gray"]; {1};\n', type, flow_node);
						connections += sf('{0} -> {1} [ minlen = 1.0 ];\n', node_name, flow_node);
					}
					flow[type].forEach(function(next) {
						connections += sf('{0} -> {1};\n', flow_node, next.replace(/\-/, '_'));
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
