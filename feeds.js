var FeedParser = require('feedparser');


// var seen = {};
// feedparser.on('readable', function() {
// 	var stream = this;
// 	var article;
// 	while (article = stream.read()) {
// 		var time = article.date.getTime();
// 		if (!(article.guid in seen) || (seen[article.guid] !== 0 && seen[article.guid] != time)) {
// 			seen[article.guid] = article.date ? time : 0;
// 		}
// 	}
// });


module.exports = {};