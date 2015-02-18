var lowdb = require('lowdb');


var db_filename = 'db.json';
var db_settings = {
	autosave: true, // automatically save on change
	async: true // async write
};


function connect() {
	var db = lowdb(db_filename, db_settings);
	return db;
}

// db('posts').push({ title: 'lowdb is awesome' });
// db('posts').find({ title: 'lowdb is awesome' });


module.exports = {
	connect: connect
};
