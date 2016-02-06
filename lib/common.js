'use strict';


const printStacktrace = module.exports.printStacktrace =
function printStacktrace(err) {
	console.error(err.stack);
};


const parseJSON = module.exports.parseJSON =
function parseJSON(jsonStr) {
	try {
		return JSON.parse(jsonStr);
	} catch (e) {
		throw new Error('could not parse JSON');
	}
};
