var Twit = require('twit');


function create_client(credentials) {
	var client = new Twit(credentials);
	return client;
}


module.exports = {
	create_client: create_client
};
