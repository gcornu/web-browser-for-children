exports.getChildFavorites=getChildFavorites
exports.setPort = setPort;
exports.setFav_toolbar = setFav_toolbar;
exports.destroyFav_toolbar = destroyFav_toolbar;

var pageMod = require("sdk/page-mod");
var data = require("sdk/self").data;
var fileHandler = require('fileHandler');
var port = null;
var fav_toolbar;


//Sends an event containing child-favorites.json's content
function getChildFavorites(){
	function callback(data){port.emit('child-favorites_read' ,data.favorites );}
	fileHandler.readJSON('child-favorites.json', callback);
}



/**
 * Set port for event emitting
 */
function setPort(portParam) {
	port = portParam;
}


function setFav_toolbar(){
	fav_toolbar=pageMod.PageMod({
		include: "*",
		contentScriptFile: [data.url("jquery-2.0.3.js"),data.url("fav_toolbar.js")],
		contentStyleFile: data.url("css/fav_toolbar.css"),
		onAttach: function(worker) {
			function callback(favorites_file){
				var star_icon = data.url('star-icon.png');
				//var data_to_send = 'blabla';
				var data_to_send={ 'star' : star_icon , 'favorites' : favorites_file.favorites}
				worker.port.emit('favorites_toolbar' , data_to_send);
			}
			fileHandler.readJSON('child-favorites.json', callback);
			
			//here to set all the communication with fav_toolbar.js
		}
	});
}


function destroyFav_toolbar(){
	fav_toolbar.destroy();
}