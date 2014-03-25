$(function () {
	// Localization : setting values that cannot be localized in plain HTML
	$('#change_pass').attr('value', self.options.change_pass_value);
	$('#set-private-question').attr('value', self.options.set_private_question_value);

	/**
	 * Password page submit action
	 */
	$("#change-pass-pane input.password").keyup(function (event) { 
		//if user presses enter while in a password field, "click" on the submit button
		if(event.keyCode == 13) {
			$("#change_pass").click();
		}
	});

	$("#private-question-pane input.password").keyup(function (event) { 
		//if user presses enter while in a password field, "click" on the submit button
		if(event.keyCode == 13) {
			$("#set-private-question").click();
		}
	});
	
	$("#change_pass").click(function () {
		$(".alert").hide(); //remove any leftover alert

		if($("#new_pass1").val() === $("#new_pass2").val() && $("#new_pass1").val().length >= 4){ //if there was no validation error, send old and new passwords
			var pwords = {};
			pwords.oldpass = $("#old_pass").val();
			pwords.newpass = $("#new_pass1").val();
			self.port.emit("update_pass", pwords);
		} else if($("#new_pass1").val() !== $("#new_pass2").val()) {
			$("#new_pass2").parent().addClass('has-error');
			$("#new_pass2").parent().find('.help-block').css('visibility', 'visible');
		} else if($("#new_pass1").val().length < 4) {
			$("#new_pass1").parent().addClass('has-error');
			$("#new_pass1").parent().find('.help-block').css('visibility', 'visible');
		}
	});

	$('#old_pass').on('change keyup paste', function () {
		$(this).parent().removeClass('has-error');
		$(this).parent().find('.help-block').css('visibility', 'hidden');
	});

	$('#new_pass1').on('change keyup paste', function () {
		if($(this).val().length >= 4) {
			$(this).parent().removeClass('has-error').addClass('has-success');
			$(this).parent().find('.help-block').css('visibility', 'hidden');
		}
		$('#new_pass2').change();
	});

	$('#new_pass1').focusout(function () {
		if($(this).val().length < 4) {
			$(this).parent().removeClass('has-success').addClass('has-error');
			$(this).parent().find('.help-block').css('visibility', 'visible');
		}
	});

	$('#new_pass2').on('change keyup paste', function () {
		if($(this).val() === $('#new_pass1').val()) {
			$(this).parent().removeClass('has-error').addClass('has-success');
			$(this).parent().find('.help-block').css('visibility', 'hidden');
		} else {
			$(this).parent().removeClass('has-success').addClass('has-error');
			$(this).parent().find('.help-block').css('visibility', 'visible');
		}
	});

	$('#set-private-question').click(function () {
		self.port.emit('set_private_question', $('#secret-question').val(), $('#secret-answer').val());
		$('#private-question-pane').hide();
		$('#change-pass-pane').show();
		// display menu if hidden
		if($('#nav').css('opacity') == 0) {
			$('#welcome').remove();
			$('#change-password-title').show();
			$('#nav').css('visibility', 'visible');
			$('#nav').animate({
				opacity: '1.0'
			}, 1000, function () {
				
			});
			showTour();
		}
	});
});

// external events listeners
self.port.on("change_pass_result", function (result) {
	if(result) {
		inform(self.options.password_change_success, "success", 3000);
		$("#old_pass").parent().show(); //this was hidden if first password change
		$('#change-pass-pane').hide();
		$('#private-question-pane').show();
		$("#welcome").hide();
		$("input[type=password]").val(""); //set all fields to empty
		$('#old_pass, #new_pass1, #new_pass2').parent().removeClass('has-error').removeClass('has-success');
	} else {
		$('#old_pass').parent().addClass('has-error');
		$('#old_pass').parent().find('.help-block').css('visibility', 'visible');
	}
});

self.port.on("set_first_password", function () {
	showTab("pass");
	$("#old_pass").parent().hide();
	$('#change-password-title').hide();
	$('#nav').css('opacity', 0);
	$('#nav').css('visibility', 'hidden');
	$("#message_container").append($('<div>', {'id': 'welcome'}).append($('<h3>', {'text': self.options.welcome_text}))
																.append($('<p>', {'text': self.options.welcome_advice})));
});