self.port.on('favorites_toolbar' , function(favorites){
	var fav_toolbar=$('<div>');
	
	$(favorites).each(function(index, favorite){
		var link=$('<a>').attr('href' , favorite.uri);
		var image = $('<img>');
		$(image).attr('src' , 'http://g.etfv.co/'+favorite.uri)
		$(link).append(image);
		$(fav_toolbar).append(link);
	});
	$(fav_toolbar).addClass('fav_toolbar');
	
	
	var add_favorite_image=$('<img>');
	$(add_favorite_image).attr('src' , 'star-icon.png');
	$(fav_toolbar).append(add_favorite_image);

	$('body').prepend(fav_toolbar);
});



//http://getfavicon.appspot.com/