var path = require('path');
var chalk = require('chalk');


module.exports.get_paths =
function() {
	var root = path.resolve('./');
	return {
		root: root,
		lib: path.join(root, 'lib'),
		blocks: path.join(root, 'blocks')
	};
};


module.exports.f1 =
function(s) {
	return chalk.magenta(s);
};

module.exports.f2 =
function(s) {
	return chalk.bgMagenta.black(s);
};

module.exports.f3 =
function(s) {
	return chalk.bgMagenta.white(s);
};
