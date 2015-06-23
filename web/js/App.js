var _ = require('lodash');
var React = require('react');

var Task = require('./Task.js');


var App = React.createClass({
	propTypes: {
		tasks: React.PropTypes.object.isRequired
	},

	render: function() {
		return (
			<div>
				<div id="menu">
					<h1>'cause</h1>
					<div id="task-list">

					</div>
				</div>
				<div id="tasks">
					{_.values(this.props.tasks).map(this.renderTask)}
				</div>
			</div>
		);
	},

	renderTask: function(task, index) {
		return <Task task={task} key={index} />;
	}
});


module.exports = App;
