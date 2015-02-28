var _ = require('lodash');
var winston = require('winston');
var chalk = require('chalk');
var numeral = require('numeral');


function handle_error(err) {
	winston.error(err);
}


function get_by(obj_array, key, value) {
	return obj_array.filter(function(o) {
		return (o[key] == value);
	});
}


function get_all_by_name(array, name) {
	return get_by(array, 'name', name);
}


function get_by_name(array, name) {
	return get_all_by_name(array, name)[0];
}


function get_children(step, task) {
	var connections = get_by(task.flow, 'from', step.id);
	var children = connections.map(function(connection) {
		var step = get_by(task.steps, 'id', connection.to)[0];
		return step;
	});
	return children;
}


function message_vars(task, input, step, prev_step) {
	return {
		task: task,
		input: input,
		step: step,
		prev_step: prev_step,
		format: {
			list: function(l) { return l.join('\n'); },
			money: function(x) { return numeral(x).format('0.00'); }
		}
	};
}


function list_tasks() {
	console.log('———————————————');
	console.log('TASKS');
	tasks.forEach(function(task) {
		console.log( sf('- {0} ({1})', chalk.bgBlue(task.name), task.interval) );
	});
	console.log('———————————————');
}


module.exports = {
	handle_error: handle_error,
	get_by: get_by,
	get_all_by_name: get_all_by_name,
	get_by_name: get_by_name,
	get_children: get_children,
	list_tasks: list_tasks,
	message_vars: message_vars,
};
