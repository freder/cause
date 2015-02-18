var winston = require('winston');


function handle_error(err) {
	// util.error(chalk.red(err));
	winston.error(err);
}


module.exports = {
	handle_error: handle_error
};
