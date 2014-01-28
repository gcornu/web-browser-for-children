$(function(){
	$("#browse").click(function(){
		self.port.emit("browse");
	});
	$("#settings").click(function(){
		self.port.emit("settings");
	});
});