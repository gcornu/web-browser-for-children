//window.alert("Page matches ruleset");
$('body').prepend('hello');
self.port.emit('require_favorites_toolbar');

self.port.on('favorites_toolbar' , function(){
console.log('hello2');
	//window.alert("Page matches ruleset");
	
	
	var style = "padding : 0px; margin : 0px; margin-top:2px; background-color:blue; width:100%; height:100px;";

	var fav_toolbar=$('<div>');
	$(fav_toolbar).addClass('fav_toolbar');
	$(fav_toolbar).attr('style', style);
	$(fav_toolbar).prepend('Hello');


	$('body').prepend(fav_toolbar);
});