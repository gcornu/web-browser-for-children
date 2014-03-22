self.port.on('favorites_toolbar' , function(data_received){
	
	var favorites=data_received.favorites
	
	var fav_toolbar=$('<div>');
	$(fav_toolbar).addClass('child_fav_toolbar');
	
	$(favorites).each(function(index, favorite){
		var link=$('<a>').attr('href' , favorite.uri);
		var image = $('<img>');
		$(image).attr('src' , 'http://g.etfv.co/'+favorite.uri)
		$(link).append(image);
		$(fav_toolbar).append(link);
	});
	
	var add_favorite_image=$('<img>');
	$(add_favorite_image).attr('src' , data_received.star).addClass('favorite_button');
	$(fav_toolbar).append(add_favorite_image);

	$('body').prepend(fav_toolbar);
});



//http://getfavicon.appspot.com/