$(function () {
	/**
	  * Nav bar management
	*/
    "use strict";
    $("#nav li").click(function () {
		showTab($(this).attr('id'));
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
		if(problem===""){ //if there was no validation error, send old and new passwords
			var pwords = {};
			pwords.oldpass=$("#old_pass").val();
			pwords.newpass=$("#new_pass1").val();
			self.port.emit("update_pass",pwords);
			}
		else inform(problem,"error");
			//in case there was a message generated, append it to the page.
	});

    /**
     *
    */
    $("input:radio[name=filteringOptions]").click(function () {
        var val=$(this).val();
        self.port.emit("filter",val); //val can be none, wlist or blist
    });
	
	/**
	 * Init tabs in lists management
	 */
	$('#lists-tabs a').click(function(e) {
		e.preventDefault();
		$(this).tab('show');
		self.port.emit('lists_tab_choice', $(this).attr('id'));
	});
	$('#default_blacklist').click();

	$('#remove-default-blacklist').click(function() {
		defaultListsButtonHandler('blacklist', 'remove');
	});

	$('#add-default-blacklist').click(function() {
		defaultListsButtonHandler('blacklist', 'add');
	});

	$('#remove-default-whitelist').click(function() {
		defaultListsButtonHandler('whitelist', 'remove');
	});

	$('#add-default-whitelist').click(function() {
		defaultListsButtonHandler('whitelist', 'add');
	});

	$('#add-custom-blacklist').click(function() {
		var uri = window.prompt('Please enter the URL you want to add to the blacklist:');
		if(uri) {
			self.port.emit('add_custom_blacklist', uri);
		}
	});

	$('#remove-custom-blacklist').click(function() {
		customListsButtonHandler('blacklist');
	});

	$('#add-custom-whitelist').click(function() {
		var uri = window.prompt('Please enter the URL you want to add to the whitelist:');
		if(uri) {
			self.port.emit('add_custom_whitelist', uri);
		}
	});

	$('#remove-custom-whitelist').click(function() {
		customListsButtonHandler('whitelist');
	});
});

function inform(message,type) { //adds the message to the page in an alert div depending on type (error or success)
	var alertclass = "";
	switch(type){
		case "error":
			alertclass="\"alert alert-danger\"";
		break;
		case "success":
			alertclass="\"alert alert-success\"";
		break;
	}
	$(".panel").append("<div class="+alertclass+"><small>"+message+"</small></div>");
}

self.port.on("change_pass_result",function(result){
	if(result) {
		inform("Password successfully changed","success"); 
        $("#nav").hide();
        $(".container").hide();
        setTimeout(function(){
			self.port.emit("password_done");
			$("#nav").show();
			$("#old_pass").parent().show(); //this was hidden if first password change
			$("#welcome").hide();
			$("input[type=password]").val(""); //set all fields to empty
			showTab("gen");
		},3000);
    }
	else inform("Password was not changed. Is your old password correct?","error");
});

self.port.on("set_first_password", function(){
	showTab("pass");
	$("#old_pass").parent().hide();
	$(".panel").prepend("<div id=\"welcome\"><h2>Welcome to the Firefox for children extension</h2><p>Please set your parent password below:</p></div>");
});

self.port.on("current_filter", function(value){
	//$('#gen_tab input:radio[value=' + value + ']').prop('selected', 'selected');
});

// Add elements in lists when initialization is done
self.port.on('blacklist_initialized', function(defaultBlacklist, removedDefaultBlacklistElements) {
	fillListDivs(defaultBlacklist, removedDefaultBlacklistElements, 'blacklist');
});

self.port.on('whitelist_initialized', function(defaultWhitelist, removedDefaultBlacklistElements) {
	fillListDivs(defaultWhitelist, removedDefaultBlacklistElements, 'whitelist');
});

self.port.on('blacklist_custom_added', function(host) {
	addCustomListListener('blacklist', host);
});

self.port.on('whitelist_custom_added', function(host) {
	addCustomListListener('whitelist', host);
});

/**
 * Event listener when an entry is added in the custom lists
 *
 * @param {blacklist|whitelist} listType
 * @param {string} host
 */
function addCustomListListener(listType, host) {
	if(host) {
		$('#custom-' + listType + '-inner').append('<input type="checkbox" id="' + host + '"/><label for="' + host + '">' + host + '</label><br/>');
	} else {
		inform('Host was not added to the ' + listType + '. Please check your syntax.');
	}
}

function fillListDivs(defaultList, removedList, name) {
	var title = $('#default-' + name + '-inner h3');
	var removedTitle = $('#removed-default-' + name + '-inner h3');
	$('#default-' + name + '-inner').empty().append(title);
	$('#removed-default-' + name + '-inner').empty().append(removedTitle);
	defaultList.forEach(function(elem) {
		$('#default-' + name + '-inner').append('<input type="checkbox" id="' + elem + '"/><label for="' + elem + '">' + elem + '</label><br/>');
	});
	removedList.forEach(function(elem) {
		$('#removed-default-' + name + '-inner').append('<input type="checkbox" id="' + elem + '"/><label for="' + elem + '">' + elem + '</label><br/>');
	});
}

/**
 * Event handler for default lists actions
 *
 * @param {blacklist|whitelist} listType
 * @param {add|remove} eventType
 */
function defaultListsButtonHandler(listType, eventType) {
	var prefixOrigin = eventType === 'add' ? 'removed-' : '';
	var prefixDest = prefixOrigin === 'removed-' ? '' : 'removed-';
	var checked_elements = [];
	$('#' + prefixOrigin + 'default-' + listType + '-inner input:checked').each(function(index, element) {
		checked_elements.push(element.id);
		var label = $(element).next()
		var br = $(element).next().next();
		$(element).attr('checked', false);
		$('#' + prefixDest + 'default-' + listType + '-inner').append($(element)).append(label).append(br);
	});
	self.port.emit(eventType + '_default_' + listType, checked_elements);
}

/**
 * Event handler for custom lists remove action
 *
 * @param {blacklist|whitelist} listType
 */
function customListsButtonHandler(listType) {
	var checked_elements = [];
	$('#custom-' + listType + '-inner input:checked').each(function(index, element) {
		checked_elements.push(element.id);
		var label = $(element).next()
		$(element).next().next().remove();
		label.remove();
		element.remove();
	});
	self.port.emit('remove_custom_' + listType, checked_elements);
}

function showTab(tab_choice) { //hides other content and shows chosen tab "pass","gen","lists" or "report"
	self.port.emit("tab_choice",tab_choice);
	$(".container").hide();
	$(".alert").hide(); //remove leftover alerts
	$("#"+tab_choice+"_tab").show();
	$("#nav .active").removeClass("active");
	$("#"+tab_choice).addClass("active");
}
