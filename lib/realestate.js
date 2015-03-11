var sf = require('sf');
var _ = require('lodash');
var chalk = require('chalk');


function email_template(items) {
	var email_content = '';

	var defaults = {
		link: '?',
		neighborhood: '?',
		street: '?',
		maps_url: '?',
		images: [],
		price: '?',
		type: '?',
		rooms: '?',
		area: '?'
	};

	items.forEach(function(item) {
		item = _.defaults(item, defaults);

		var txt = '<br><hr>';

		var street_link = sf('<a href="{0}">{1}</a>', item.maps_url, item.street);
		txt += sf('<h3>{0}</h3>', street_link);

		item.images.forEach(function(img) {
			txt += sf('<img src="{0}" style="height:200px; max-height:200px; width:auto; display:inline; float:left;"><br style="clear:both;">', img);
		});

		txt += sf('neighborhood: <b>{0}</b><br>', item.neighborhood);
		txt += sf('price: <b>{0} EUR</b><br>', item.price);
		txt += sf('type: <b>{0}</b><br>', item.type);
		txt += sf('rooms: <b>{0}</b><br>', item.rooms);
		txt += sf('area: <b>{0}</b><br>', item.area);

		var info_link = sf('<a href="{0}">more info</a>', item.link);
		txt += sf('<b>{0}</b><br>', info_link);
		txt += '<br>';

		email_content += txt;
	});

	return email_content;
}


module.exports = {
	email_template: email_template
};
