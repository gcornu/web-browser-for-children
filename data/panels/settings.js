$(function(){
/**
  * Nav bar management
*/
	$("#gen").click(function(){
		self.port.emit("gen");
	});
	$("#pass").click(function(){
		self.port.emit("pass");
	});

/**
  * Password page submit action
*/
	$("input.password").keyup(function(event){ 
	//if user presses enter while in a password field, "click" on the submit button
    if(event.keyCode == 13){
        $("#change_pass").click();
    }
	});
	
	$("#change_pass").click(function(){
		$(".alert").hide(); //remove any leftover alert
		var problem = (function(){ //do some validation and generate a message if necessary
			if($("#new_pass1").val()!==$("#new_pass2").val()){
				return "Passwords must match";
			}
			else if($("#new_pass1").val().length<4){
				return "New password must be more than 4 characters long";
			}
			else { return "";}
			})();
		if(problem==""){ //if there was no validation error, send old and new passwords
			var pwords = new Object();
			pwords.oldpass=$("#old_pass").val();
			pwords.newpass=$("#new_pass1").val();
			self.port.emit("update_pass",pwords);
			}
		else inform(problem,"error");
			//in case there was a message generated, append it to the page.
	});

});

function inform(message,type){ //adds the message to the page in an alert div depending on type (error or success)
	var alertclass = "";
	switch(type){
		case "error":
			alertclass="\"alert alert-danger\"";
		break;
		case "success":
			alertclass="\"alert alert-success\"";
		break;
		}
	$("#content").append("<div class="+alertclass+"><small>"+message+"</small></div>");
};

self.port.on("change_pass_result",function(result){
	if(result) {inform("Password successfully changed","success"); $("#old_pass").parent().show();}
	else inform("Password was not changed. Is your old password correct?","error");
});

self.port.on("set_first_password",function(){
	$("#old_pass").parent().hide();
	$("#content").prepend("<h2>Welcome to the Firefox for children extension</h2><p>Please set your parent password below:</p>");
});