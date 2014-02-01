$(function () {
	/**
	  * Nav bar management
	*/
    "use strict";
    $("#nav li").click(function () {
    	$('#welcome').remove();
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

	var idHandledButtons = '#remove-default-blacklist, ' +
						   '#add-default-blacklist, ' +
						   '#remove-default-whitelist, ' +
						   '#add-default-whitelist, ' +
						   '#remove-custom-blacklist, ' +
						   '#remove-custom-whitelist';

	$(idHandledButtons).click(function() {
		var self = this;
		var paramArray = $(self).attr('id').split('-');
		listsButtonHandler.apply(null, paramArray);
	});

	$('#add-custom-blacklist').click(function() {
		var uri = window.prompt('Please enter the URL you want to add to the blacklist:');
		if(uri) {
			self.port.emit('add_custom_blacklist', uri);
		}
	});

	$('#add-custom-whitelist').click(function() {
		var uri = window.prompt('Please enter the URL you want to add to the whitelist:');
		if(uri) {
			self.port.emit('add_custom_whitelist', uri);
		}
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
	fillListDivs(defaultBlacklist, removedDefaultBlacklistElements, 'blacklist', 'default');
});

self.port.on('whitelist_initialized', function(defaultWhitelist, removedDefaultBlacklistElements) {
	fillListDivs(defaultWhitelist, removedDefaultBlacklistElements, 'whitelist', 'default');
});

self.port.on('custom_blacklist_initialized', function(list) {
	fillListDivs(list, [], 'blacklist', 'custom');
});

self.port.on('custom_whitelist_initialized', function(list) {
	fillListDivs(list, [], 'whitelist', 'custom');
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
		inform('Host was not added to the ' + listType + '. Please check your syntax.', 'error');
	}
}

/**
 * This function fills the correct divs when lists are initialized
 *
 * @param {array[string]} defaultList list of default elements
 * @param {array[string]} removedList list of removed elements (may be empty)
 * @param {blacklist|whitelist} name of the list to be filled
 * @param {default|custom} type of the list
 */
function fillListDivs(defaultList, removedList, name, type) {
	if($('#default-blacklist-categories select').is(':empty')) {
		Object.keys(defaultList).forEach(function(category) {
			var option = $('<option>').attr('value', category).html(category.replace('_', ' '));
			$('#default-blacklist-categories select').append(option);
		});
		$('#default-blacklist-categories select').change(function() {
			$('#default-blacklist-inner div').hide();
			$('#default-blacklist-category-' + $(this).val()).show();
		});
	}
	fillListsDivsHelper(defaultList, name, type);
	if(removedList) {
		fillListsDivsHelper(removedList, name, 'removed-' + type);
	}
}

/**
 * This function is a helper for fillListsDivs function
 * This function shouldn't be used by any other function than fillListsDivs
 *
 * @param {array[string]} list of elements to add
 * @param {blacklist|whitelist} name of the list to be filled
 * @param {default|removed-default|custom} type of the given list
 */
function fillListsDivsHelper(list, name, type) {
	var title = $('#' + type + '-' + name + '-inner h3');
	$('#' + type + '-' + name + '-inner').empty().append(title);

	Object.keys(list).forEach(function(category) {
		var div = $('<div>').attr('id', type + '-' + name + '-category-' + category);
		list[category].forEach(function(elem) {
			div.append('<input type="checkbox" id="' + elem + '"/><label for="' + elem + '">' + elem + '</label><br/>');
		});
		$('#' + type + '-' + name + '-inner').append(div);
	});
	$('#default-blacklist-inner div:not(:first)').hide();
}

/**
 * Event handler for lists actions
 * 
 * @param {add|remove} event type
 * @param {blacklist|whitelist} list name
 * @param {default|custom} list type
 */
function listsButtonHandler(eventType, listType, listName) {
	var prefixOrigin = '',
		prefixDest = '',
		checked_elements = [],
		category = '';

	if(eventType) {
		prefixOrigin = eventType === 'add' ? 'removed-' : '';
		prefixDest = prefixOrigin === 'removed-' ? '' : 'removed-';
	} else {
		eventType = 'remove';
	}


	$('#' + prefixOrigin + listType + '-' + listName + '-inner input:checked').each(function(index, element) {
		checked_elements.push(element.id);
		var label = $(element).next();
		var br = $(element).next().next();
		if(prefixOrigin || prefixDest) {
			$(element).attr('checked', false);
			$('#' + prefixDest + listType + '-' + listName + '-inner').append($(element)).append(label).append(br);
		} else {
			br.remove();
			label.remove();
			element.remove();
		}
	});

	category = $('#default-blacklist-categories option:selected').val();

	self.port.emit(eventType + '_' + listType + '_' + listName, checked_elements, category);
}

function showTab(tab_choice) { //hides other content and shows chosen tab "pass","gen","lists" or "report"
	self.port.emit("tab_choice",tab_choice);
	$(".container").hide();
	$(".alert").hide(); //remove leftover alerts
	$("#"+tab_choice+"_tab").show();
	$("#nav .active").removeClass("active");
	$("#"+tab_choice).addClass("active");
}