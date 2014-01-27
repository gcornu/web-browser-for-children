$(function(){
	$("#submit").click(function(){
		var password = "";
		if($("#pass").val()) password=$("#pass").val();
		self.port.emit("answer",password);
	});
});

self.port.on("show", function onShow(){
	$("#pass").focus();
	$("#pass").val("");
	});