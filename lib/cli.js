'use strict';

const R = require('ramda');


const cliOptions = {
	version: {
		argumentType: Boolean,
		shorthand: 'v',
		tabs: '\t\t',
		description: 'show version'
	},
	help: {
		argumentType: Boolean,
		shorthand: 'h',
		tabs: '\t\t',
		description: 'show help'
	},
	task: {
		argumentType: String,
		shorthand: 't',
		tabs: '\t\t',
		description: 'run single task file'
	},
	once: {
		argumentType: Boolean,
		shorthand: 'o',
		tabs: '\t\t',
		description: 'run only once'
	},
};


// add name field
R.keys(cliOptions)
	.forEach((key) => {
		cliOptions[key].name = key;
	});

const options = module.exports.options =
R.keys(cliOptions)
	.reduce((result, key) => {
		const option = cliOptions[key];
		result[key] = option.argumentType;
		return result;
	}, {});

const shorthands = module.exports.shorthands =
R.keys(cliOptions)
	.reduce((result, key) => {
		const option = cliOptions[key];
		result[option.shorthand] = `--${key}`;
		return result;
	}, {});


const showUsage = module.exports.showUsage =
function showUsage() {
	console.log('usage:');
	R.keys(cliOptions)
		.forEach((key) => {
			console.log(usageForOption(cliOptions[key]));
		});
};


const showHelp = module.exports.showHelp =
function showHelp() {
	showUsage();
};


const usageForOption = module.exports.usageForOption =
function usageForOption(option) {
	return ` -${option.shorthand}, --${option.name}${option.tabs}${option.description}`;
};


const showVersion = module.exports.showVersion =
function showVersion() {
	const pkg = require('../package.json');
	console.log(pkg.version);
};
