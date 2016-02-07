'use strict';

const R = require('ramda');


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


const getItemByKey = module.exports.getItemByKey =
function getItemByKey(key, coll, value) {
	return R.find( R.propEq(key, value) )(coll);
};


const getItemById = module.exports.getItemById =
R.partial(getItemByKey, ['id']);
