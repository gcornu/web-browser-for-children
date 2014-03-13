exports.getChildFavorites=getChildFavorites
exports.setPort = setPort;

var fileHandler = require('fileHandler');
var port = null;

//Sends an event containing child-favorites.json's content
function getChildFavorites(){
	function callback(data){port.emit('child-favorites_read' ,data.favorites );}
	fileHandler.readJSON('child-favorites.json', callback);
	
}
//data.favorites

/**
 * Set port for event emitting
 */
function setPort(portParam) {
	port = portParam;
}
