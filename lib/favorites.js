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

/**
*Set the pagemod adding favorite toolbar at the top of each page.
*/
function setFav_toolbar(){
	fav_toolbar=pageMod.PageMod({
		include: "*",
		contentScriptFile: [data.url("jquery-2.0.3.js"),data.url("fav_toolbar.js")],
		contentStyleFile: data.url("css/fav_toolbar.css"),
		onAttach: function(worker) {
			
			//these lines send the content of favorites file to fav_toolbar, star icon and delete icon.
			function callback_send_favorites(favorites_file){
				var star_icon = data.url('star-icon.png');
				var delete_icon=data.url('delete-icon.svg');
				var data_to_send={ 'star' : star_icon , 'delete_icon':delete_icon , 'favorites' : favorites_file.favorites}
				worker.port.emit('favorites_toolbar' , data_to_send);
			}
			fileHandler.readJSON('child-favorites.json', callback_send_favorites);
			
			
			//fav_toolbar.js requesting to add a new URL to favorites
			worker.port.on('add_favorite' , function(url_to_add){
				function callback_add_favorite(favorites_file){
					//getting the favorites array
					var favorites = favorites_file.favorites;
					
					//the 2 images that can be sent as result
					var favorite_rejected = data.url('favorite-rejected.png');
					var favorite_accepted = data.url('favorite-accepted.png');
					
					//You can't have more than xx favorites
					var max_fav=15;
					if(favorites.length >= max_fav){
						worker.port.emit('add_favorite_answer' , favorite_rejected);
					}
					else{
						var already_favorite=false;
						var max_id=0;
						//checking if url already in favorites and getting max id of the already added favorites
						for(var i=0 ; i<favorites.length ; i++){
							if(favorites[i].uri === url_to_add){
								already_favorite=true;
							}
							if(favorites[i].index > max_id){
								max_id=favorites[i].index
							}
						}
						
						
						//if the url is already in favorites
						if(already_favorite){
							worker.port.emit('add_favorite_answer' , favorite_rejected);
						}
						else{//if url not in favorites : add it and rewrite the favorite file (as the nb of favorites is very limited, we can afford to rewrite whole file everytime)
							var new_favorite={"index":max_id+1 , "title":"Favorite" , "uri":url_to_add};			
							favorites.push(new_favorite);
							var file_content={"favorites" : favorites};					
							fileHandler.writeJSON(file_content , 'child-favorites.json'); 
							worker.port.emit('add_favorite_answer' , favorite_accepted);
						}
					}
					
					
				
				
				}
				fileHandler.readJSON('child-favorites.json', callback_add_favorite);
			
			});
			
			
			
			//here to set all the communication with fav_toolbar.js
		}
	});
}


function destroyFav_toolbar(){
	fav_toolbar.destroy();
}