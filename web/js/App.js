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
					<strong>'cause</strong><br />
					<br />
					<div id="task-list">
						{_.keys(this.props.tasks).map(this.renderMenuItem)}
					</div>
				</div>
				<div id="tasks">
					{/*_.values(this.props.tasks).map(this.renderTask)*/}
					{this.renderSelectedTask()}
				</div>
			</div>
		);
	},

	selectTask: function(name, event) {
		event.preventDefault();
		this.setState({ selectedTask: name });
	},

	renderMenuItem: function(name, index) {
		var that = this;
		return (
			<div className='menu-item' key={index}>
				<a href="#" onClick={_.partial(that.selectTask, name)}>{name}</a>
			</div>
		);
	},

	renderSelectedTask: function() {
		var state = this.state;
		if (!state.selectedTask) return null;
		var props = this.props;
		var task = props.tasks[state.selectedTask];
		return this.renderTask(task, task.slug);
	},

	renderTask: function(task, key) {
		return <Task task={task} key={key} />;
	},

	getInitialState: function() {
		return {
			selectedTask: false
		};
	}
});


module.exports = App;
