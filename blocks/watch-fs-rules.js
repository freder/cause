'use strict';

module.exports = [
	{
		watch: ['/Users/fredericbrodbeck/Desktop/_screenshots/*.png'],
		// ignore: /[\/\\]\./,
		on: {
			add: function(path) {
				console.log(path, 'added');
			},
			// change: ...
			// unlink: ...
		}
	}
];
