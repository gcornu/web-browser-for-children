//The fav_toolbar which is going to be displayed at the top of all pages
var fav_toolbar=$('<div>');
$(fav_toolbar).addClass('child_fav_toolbar');
	
//The var which is going to contain the star-icon and event to add a favorite.
var add_favorite_image=$('<img>');
	

self.port.on('favorites_toolbar' , function(data_received){
	
	var favorites=data_received.favorites
	//Adding the favorites to the toolbar with favicon images and url
	$(favorites).each(function(index, favorite){
		var link=$('<a>').attr('href' , favorite.uri);
		var image = $('<img>');
		$(image).attr('src' , 'http://g.etfv.co/'+favorite.uri);
		$(image).addClass('favorite');
		$(link).append(image);
		$(fav_toolbar).append(link);
		
		//adding the delete button
		var delete_button=$('<img>');
		$(delete_button).attr('src' , data_received.delete_icon).addClass('delete_button');
		$(fav_toolbar).append(delete_button);
		
		//when delete_button is clicked : emit a message to favorites.js to delete
		$(delete_button).click(function(){
			self.port.emit('delete_favorite' , favorite.index);
		});
		
	});
	
	//Creating the new favorite button, which emits a message received by favorites.js to add (or not) the favorite
	$(add_favorite_image).attr('src' , data_received.star).addClass('favorite_button');
	$(fav_toolbar).append(add_favorite_image);
	$(add_favorite_image).click(function(){
		self.port.emit('add_favorite' , document.URL);
	});
	
	
	
	$('body').prepend(fav_toolbar);
	
	
	
	self.port.on('favorite_answer' , function(answer_image){
		var answer_image_container=$('<img>');
		$(answer_image_container).attr('src' , answer_image).addClass('answer_image');
		$(fav_toolbar).append(answer_image_container);
	});
});



//http://getfavicon.appspot.com/