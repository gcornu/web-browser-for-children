exports.getChildFavorites=getChildFavorites


var fileHandler = require('fileHandler');


function getChildFavorites(){
	function callback(data){port.emit('child-favorites_read' , data.favorites);}
	fileHandler.readJSON('child-favorites.json', callback);
	
}