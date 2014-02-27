$(function () {
	//Cannot use jQuery's "submit()" as if I wrap in a <form> element, firefox tries to save the password and throws error because it is not a browser window...
	
	$("#pass").keyup(function (event) {
	//if user presses enter while in the password field, "click" on the submit button
        if (event.keyCode === 13) {
            $("#submit").click();
        }
	});

	$("#submit").click(function () {
		var password = "";
		if ($("#pass").val()) {password = $("#pass").val(); } 
		if ($("#input").length===1) self.port.emit("answer", password); //do this if safe browsing is off
		else if($("#input-lock").length===1) self.port.emit("answer-lock", password)
		else if($("#input-safe").length===1) self.port.emit("answer-unlock", password); //do this if safe browsing is on
		else self.port.emit("answer-options", password);

		//remove answer from input field
		$('#pass').val('');
		newAttempt();
	});
});

self.port.on("show", newAttempt);
	
self.port.on("auth_fail", function () {
	$('.alert').remove();
	$("#pass").after("<div style=\"margin:5px 0px\" class=\"alert alert-danger\"><small>Sorry, the password is wrong</small></div>");
});

self.port.on("ison", function () { //change the page when safe browsing is on
	clean();
	$("#pass").before("<div style=\"margin:5px 0px\" class=\"alert alert-warning\"><small>This will disable safe browsing</div>");
	$("#input").attr("id","input-safe");
});

self.port.on("isoff", function () { //change the page when safe browsing is on
	clean();
	$("#pass").before("<div style=\"margin:5px 0px\" class=\"alert alert-info\"><small>This will enable safe browsing</div>");
	$("#input").attr("id","input-lock");
});

self.port.on("options", function () { //change the page when safe browsing is on
	clean();
	$("#input").attr("id","input-options");
});

self.port.on("auth_success", function() {
	clean();
});

//clean everything
function clean() {
	$("#input-safe, #input-lock, #input-options").attr("id","input");
	$('.alert').remove();
}

//give focus to input field and clean it at new attempt
function newAttempt() {
	$('#pass').focus();
	$('#pass').val('');
}