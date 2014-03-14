$('#pass-label').css('visibility', 'hidden');
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
		else if($("#input-options").length===1) self.port.emit("answer-options", password);
		else if($("#input-addBlacklist").length===1) self.port.emit("answer-addBlacklist", password);
		else if($("#input-addWhitelist").length===1) self.port.emit("answer-addWhitelist", password);

		//remove answer from input field
		$('#pass').val('');
		newAttempt();
	});
});

function inform(message, alertClass, timeout) {
	$('#message_container').append($('<div>', {'id': 'inform', 'style': 'height: 30px; padding-top: 5px; padding-bottom: 5px;', 'class': 'alert alert-' + alertClass})
									.append($('<small>', {'text': message})));

	if(timeout) {
		setTimeout(function () {
			$('#message_container #inform').fadeOut(500, function () {
				$('#message_container #inform').remove();
			});
		}, timeout);
	}
}

self.port.on("show", newAttempt);
	
self.port.on("auth_fail", function () {
	$('#pass').parent().addClass('has-error');
	$('#pass-label').css('visibility', 'visible');
});

self.port.on("ison", function () { 
	clean();
	inform('This will disable safe browsing', 'warning');
	$("#input").attr("id","input-safe");
});

self.port.on("isoff", function () { 
	clean();
	inform('This will enable safe browsing', 'info');
	$("#input").attr("id","input-lock");
});

self.port.on("options", function () { 
	clean();
	$("#input").attr("id","input-options");
});

self.port.on("addBlacklist", function () { 
	clean();
	$("#input").attr("id","input-addBlacklist");
});

self.port.on("addWhitelist", function () { 
	clean();
	$("#input").attr("id","input-addWhitelist");
});

self.port.on("auth_success", function() {
	clean();
});

//clean everything
function clean() {
	$("#input-safe, #input-lock, #input-options").attr("id","input");
	$('#inform').remove();
	$('#pass-label').css('visibility', 'hidden');
	$('#pass').parent().removeClass('has-error');
}

//give focus to input field and clean it at new attempt
function newAttempt() {
	$('#pass').focus();
	$('#pass').val('');
}