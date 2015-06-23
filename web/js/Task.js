var $ = require('jquery');
var _ = require('lodash');
var d3 = require('d3');
var dagreD3 = require('dagre-d3');
var React = require('react');


function run_task(slug) {
	$.post('/run/'+slug, {}, function(res) {
		console.log(res.ok);
	});
}


function make_graph(svg, task) {
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
	var svg = d3.select(svg);
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


var Task = React.createClass({
	propTypes: {
		task: React.PropTypes.object.isRequired
	},

	render: function() {
		var task = this.props.task;
		return (
			<div>
				<div className='task-name'>
					{task.name}
				</div>
				{ (task.interval)
					? <div className='task-interval'>{task.interval}</div>
					: null
				}
				{ (task.interval)
					? <div className='task-run'><button onClick={function(){ run_task(task.slug); }}>run now</button></div>
					: null
				}
				<div className='code'>
					{ /*textarea.codemirror #{JSON.stringify(t, null, 4)}*/ }
				</div>
				<div className='visualization'>
					<svg ref='svg'></svg>
				</div>
			</div>
		);
	},

	componentDidMount: function() {
		var svg = this.refs.svg.getDOMNode();
		make_graph(svg, this.props.task);
	}
});


module.exports = Task;
