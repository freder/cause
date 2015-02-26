var _ = require('lodash');
var winston = require('winston');
var chalk = require('chalk');
var notifier = require('node-notifier');
var sf = require('sf');


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

function invoke_children(step, task, output) {
	var children = get_children(step, task);
	children.forEach(function(child) {
		child.execute(output, step, output);
	});
}

function validate_step_data(step, defaults) {
	defaults = defaults || {};
	step.data = step.data || {};
	return _.defaults(step.data, defaults);
}
function validate_step_options(step, defaults) {
	defaults = defaults || {};
	step.options = step.options || {};
	return _.defaults(step.options, defaults);
}


function message_vars(task, input, step, prev_step) {
	return {
		task: task,
		input: input,
		step: step,
		prev_step: prev_step
	};
}


module.exports = {
	handle_error: handle_error,
	get_by: get_by,
	get_all_by_name: get_all_by_name,
	get_by_name: get_by_name,
	get_children: get_children,
	invoke_children: invoke_children,
	validate_step_options: validate_step_options,
	validate_step_data: validate_step_data,
	message_vars: message_vars
};
