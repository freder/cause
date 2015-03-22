'use strict';

var elems = document.querySelectorAll('.codemirror');
for (var i = 0; i < elems.length; i++) {
	var editor = CodeMirror(function(cm_el) {
			elems[i].parentNode.replaceChild(cm_el, elems[i]);
		},
		{
			value: elems[i].value,
			mode: 'javascript',
				json: true,
			theme: 'monokai',
			//- lineNumbers: true,
			styleActiveLine: true
		}
	);
	//- console.log(editor.getValue());
}


function run_task(slug) {
	$.post('/run/'+slug, {}, function(res) {
		console.log(res.ok);
	});
}


function make_graph(task) {
	var g = new dagreD3.graphlib.Graph()
		.setGraph({});
		// .setDefaultEdgeLabel(function() { return {}; });

	g.graph().rankdir = "LR";
	// g.graph().ranksep = 15;
	// g.graph().nodesep = 15;

	// g.setNode(task.slug, {
	// 	label: task.name,
	// 	class: 'task'
	// });

	task.steps.forEach(function(step) {
		g.setNode(step.id, {
			label: step.block,
			class: 'step'
		});

		// edges
		var flow = step.flow;
		['if', 'else', 'always'].forEach(function(type) {
			var f = flow[type] || [];
			f.forEach(function(next_id) {
				g.setEdge(step.id, next_id, { label: type });
			});
		});
	});

	g.nodes().forEach(function(v) {
		var node = g.node(v);
		// Round the corners of the nodes
		node.rx = node.ry = 5;
	});

	// Create the renderer
	var render = new dagreD3.render();

	// Set up an SVG group so that we can translate the final graph.
	var svg = d3.select('#'+task.slug+' .visualization svg');
	var svgGroup = svg.append('g');

	// Run the renderer. This is what draws the final graph.
	render(svg.select('g'), g);

	// Center the graph
	svg.attr('height', g.graph().height)
	svg.attr('width', g.graph().width)
	// var xCenterOffset = (svg.attr('width') - g.graph().width) / 2;
	// svgGroup.attr('transform', 'translate(' + xCenterOffset + ', 20)');
	// svg.attr('height', g.graph().height + 40);
}


$(document).ready(function() {
	_.keys(tasks).forEach(function(name) {
		// console.log(name);
		make_graph(tasks[name]);
	});
});
