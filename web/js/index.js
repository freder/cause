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
		.setGraph({
			rankdir: 'LR',
			// ranksep: 15,
			// nodesep: 15
		});
		// .setDefaultEdgeLabel(function() { return {}; });

	// g.setNode(task.slug, {
	// 	label: task.name,
	// 	class: 'task'
	// });

	task.steps.forEach(function(step) {
		var label = step.block;
		if (step._description) {
			// label += '\n'+step._description;
			label = step._description;
		}
		g.setNode(step.id, {
			label: label,
			class: 'step'
		});

		// edges
		var flow = step.flow;
		['if', 'else', 'always'].forEach(function(type) {
			var f = flow[type] || [];

			if (f.length > 0) {
				var flow_node_id = step.id+'-'+task.slug;
				g.setNode(flow_node_id, {
					label: type,
					class: 'flow',
					shape: 'diamond'
				});
			}

			f.forEach(function(next_id) {
				g.setEdge(step.id, flow_node_id, { arrowhead: 'undirected' });
				g.setEdge(flow_node_id, next_id, { /*label: type*/ });
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


function init_websocket() {
	var socket = io('http://localhost:'+websocket_port);

	socket.on('connect', function() {
		console.log('CONNECT');
	});

	socket.on('console_data', function(data) {
		// var $console = $('#console');
		// $console.append( $('<div>'+data+'</div>') )
		// $console.scrollTop($console[0].scrollHeight);

		var method = 'log';
		if (/\d\d i: /.test(data)) method = 'log';
		if (/\d\d w: /.test(data)) method = 'warn';
		if (/\d\d e: /.test(data)) method = 'error';
		var style = 'background-color: black; color: white; font-size: 16px; padding: 3px;';
		console[method]('%c'+data, style);
	});

	socket.on('disconnect', function() {
		console.log('DISCONNECT');
	});
}


$(document).ready(function() {
	init_websocket();

	_.keys(tasks).forEach(function(name) {
		make_graph(tasks[name]);
	});
});
