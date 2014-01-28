$(function(){
	$("#browse").click(function(){
		self.port.emit("answer","browse");
	});
	$("#settings").click(function(){
		self.port.emit("answer","settings");
	});
});