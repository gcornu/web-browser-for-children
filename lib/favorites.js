exports.getChildFavorites=getChildFavorites
exports.setPort = setPort;

var fileHandler = require('fileHandler');

var port = null;

function getChildFavorites(){
console.log('hellochild');
	function callback(data){port.emit('child-favorites_read' ,"bonjour" );console.log("callback");}
	fileHandler.readJSON('child-favorites.json', callback);
	
}
//data.favorites

/**
 * Set port for event emitting
 */
function setPort(portParam) {
	port = portParam;
}

