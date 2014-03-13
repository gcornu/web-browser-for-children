	self.port.emit('truc');
	console.log('child js');
	
	
	// var homeWebsites=new Array(
		// {'url' : "http://kidrex.org" ,  "thumb":"kidrex.jpg" },
		// {"url" : "http://super-kids.com" ,  "thumb": "super-kids.jpg"},
		// {"url" : "http://kidtopia.info/" ,  "thumb": "kidtopia.jpg"},
		// {"url" : "http://searchypants.com" ,  "thumb": "searchypants.jpg"},
		// {"url" : "http://www.kideos.com/" ,  "thumb": "kideos.jpg"},
		// {"url" : "http://www.kidsgames.org/" ,  "thumb": "kidsgames.jpg"},
		// {"url" : "http://disney.com" ,  "thumb": "disney.jpg"},
		// {"url" : "http://www.nick.com/" ,  "thumb": "nick.jpg"},
		// {"url" : "http://en.poney-academy.com/index.html" ,  "thumb": "poney-academy.jpg"}
		// );
	
	// $('.col-md-4').each(function(index, element){
		// var link=$(element).children('a');
		// var image=$(link).children('img');
		// var website=homeWebsites[index];
		// $(link).attr('href' , website.url);
		// $(image).attr('src' , 'screenshots/'+website.thumb);
	// });

self.port.on('child-favorites_read', function (favorites) {
		console.log("hello2");
		console.log(favorites);
});