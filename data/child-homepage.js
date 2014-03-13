
//Event sent by favorites.js, containing content of child-favorites.js
self.port.on('child-favorites_read', function (favorites) {
	//going through favourites and setting images and links of the homepage
	$('.col-md-4').each(function(index, element){
		var link=$(element).children('a');
		var image=$(link).children('img');
		var favorite=favorites[index];
		$(link).attr('href' , favorite.uri);
		$(image).attr('src' , 'screenshots/'+favorite.thumb);
	});	
});

//Event sent to sbtoggle to get favorites from favorites.js
self.port.emit('require_favorites');

