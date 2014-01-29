$(function(){
	//Cannot use jQuery's "submit()" as if I wrap in a <form> element, firefox tries to save the password and throws error because it is not a browser window...
	
	$("#pass").keyup(function(event){ 
	//if user presses enter while in the password field, "click" on the submit button
    if(event.keyCode == 13){
        $("#submit").click();
    }
	});

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
	
self.port.on("auth_fail", function (){
	$("#pass").after("<div style=\"margin:5px 0px\" class=\"alert alert-danger\"><small>Sorry, the password is wrong</small></div>");
	});