//begin by hiding everything in order to prevent flickering
$(".tab_container").hide();

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
     * Save button management
     */
    $('#save').click(function () {
    	self.port.emit('save_settings');
    });

	/**
	 * Password page submit action
	 */
	$("input.password").keyup(function (event) { 
		//if user presses enter while in a password field, "click" on the submit button
		if(event.keyCode == 13) {
			$("#change_pass").click();
		}
	});
	
	$("#change_pass").click(function () {
		$(".alert").hide(); //remove any leftover alert
		var problem = (function () { //do some validation and generate a message if necessary
			if($("#new_pass1").val() !== $("#new_pass2").val()) {
				return "Passwords must match";
			} else if($("#new_pass1").val().length < 4) {
				return "New password must be more than 4 characters long";
			} else {
				return "";
			}
		})();
		if(problem === ""){ //if there was no validation error, send old and new passwords
			var pwords = {};
			pwords.oldpass = $("#old_pass").val();
			pwords.newpass = $("#new_pass1").val();
			self.port.emit("update_pass", pwords);
		} else inform(problem, "error");
			//in case there was a message generated, append it to the page.
	});

    /**
     * Handle filtering options clicks
     */
    $("input:radio[name=filteringOptions]").click(function () {
        var val = $(this).val();
        self.port.emit("filter", val); //val can be none, wlist or blist
    });
	
	/**
	 * Init tabs in lists management
	 */
	$('#lists-tabs a').click(function (e) {
		e.preventDefault();
		$(this).tab('show');
		self.port.emit('lists_tab_choice', $(this).attr('id'));
	});

	$('#default-blacklist-search-form').submit(function (e) {
		e.preventDefault();
		console.log('form submitted');
		self.port.emit('default_blacklist_search', $('#default-blacklist-search-term').val());
	});

	$('#lists').click(function (e) {
		$('#default_blacklist').click();
	});

	/**
	 * Init tabs in reports panel
	 */
	$('#reports-tabs a').click(function (e) {
		e.preventDefault();
		$(this).tab('show');
		self.port.emit('reports_tab_choice', $(this).attr('id'));
	});

	$('#reports').click(function (e) {
		$('#login').click();
	});

	$('#clear_login_log, #clear_history_log, #clear_time_log').click(function () {
		var localThis = this;
		var logType = $(localThis).attr('id').split('_')[1];
		self.port.emit('clear_log', logType);
	});

	$('#limit_time').click(function (e) {
		e.preventDefault();
		self.port.emit('limit_time_tab_clicked');
	})

	var idHandledButtons =	'#remove-default-blacklist, ' +
							'#add-default-blacklist, ' +
							'#remove-default-whitelist, ' +
							'#add-default-whitelist, ' +
							'#remove-custom-blacklist, ' +
							'#remove-custom-whitelist';

	$(idHandledButtons).click(function () {
		var self = this;
		var paramArray = $(self).attr('id').split('-');
		listsButtonHandler.apply(null, paramArray);
	});

	$('#add-custom-blacklist, #add-custom-whitelist').click(function () {
		var listName = $(this).attr('id').split('-').pop();
		var uri = window.prompt('Please enter the URL you want to add to the ' + listName + ':');
		if(uri) {
			var category = $('#custom-' + listName + '-categories select option:selected').val();
			if(category) {
				self.port.emit('add_custom_' + listName, uri, category);
			} else {
				inform('Please select a category', 'error', 5000);
			}
		}
	});

	$('#add-custom-blacklist-category, #add-custom-whitelist-category').click(function () {
		var category = window.prompt('Name of the new category:');
		if(category) {
			var id = $(this).attr('id').split('-');
			id.pop();
			var listName = id.pop();
			var select = $('#custom-' + listName + '-categories select');
			if(select.find('option[value="' + category.replace(' ', '_') + '"]').length === 0) {
				var option = $('<option>').attr('value', category.replace(' ', '_')).html(category);
				select.append(option);
				option.prop('selected', 'selected');
				select.change();
			}
		}
	});
	
	
	// ------ jQuery Tablesorter plugin------------
	$.extend($.tablesorter.themes.bootstrap, {
		// these classes are added to the table. To see other table classes available,
		// look here: http://twitter.github.com/bootstrap/base-css.html#tables
		table      : 'table table-bordered',
		caption    : 'caption',
		header     : 'bootstrap-header', // give the header a gradient background
		footerRow  : '',
		footerCells: '',
		icons      : '', // add "icon-white" to make them white; this icon class is added to the <i> in the header
		sortNone   : 'bootstrap-icon-unsorted',
		sortAsc    : 'icon-chevron-up glyphicon glyphicon-chevron-up',     // includes classes for Bootstrap v2 & v3
		sortDesc   : 'icon-chevron-down glyphicon glyphicon-chevron-down', // includes classes for Bootstrap v2 & v3
		active     : '', // applied when column is sorted
		hover      : '', // use custom css here - bootstrap class may not override it
		filterRow  : 'form-control', // filter row class
		even       : '', // odd row zebra striping
		odd        : ''  // even row zebra striping
	});
	// call the tablesorter plugin and apply the uitheme widget
	$("#table-history").tablesorter({
		// this will apply the bootstrap theme if "uitheme" widget is included
		// the widgetOptions.uitheme is no longer required to be set
		theme : "bootstrap",

		widthFixed: true,

		headerTemplate : '{content} {icon}', // new in v2.7. Needed to add the bootstrap icon!

		// widget code contained in the jquery.tablesorter.widgets.js file
		// use the zebra stripe widget if you plan on hiding any rows (filter widget)
		widgets : [ "uitheme", "filter", "zebra" ],

		widgetOptions : {
			// using the default zebra striping class name, so it actually isn't included in the theme variable above
			// this is ONLY needed for bootstrap theming if you are using the filter widget, because rows are hidden
			zebra : ["even", "odd"],

			// reset filters button
			filter_reset : ".reset"

			// set the uitheme widget to use the bootstrap theme class names
			// this is no longer required, if theme is set
			// ,uitheme : "bootstrap"
		}
	})
		.tablesorterPager({

		// target the pager markup - see the HTML block below
		container: $("#pager"),

		// target the pager page select dropdown - choose a page
		cssGoto  : ".pagenum",

		// remove rows from the table to speed up the sort of large tables.
		// setting this to false, only hides the non-visible rows; needed if you plan to add/remove rows with the pager enabled.
		removeRows: false,

		// output string - default is '{page}/{totalPages}';
		// possible variables: {page}, {totalPages}, {filteredPages}, {startRow}, {endRow}, {filteredRows} and {totalRows}
		output: '{startRow} - {endRow} / {filteredRows} ({totalRows})'

		});
});

// --- END OF document.ready function



function inform(message, type, timeout) { //adds the message to the page in an alert div depending on type (error or success)
	var alertclass = "";
	switch(type){
		case "error":
			alertclass="\"alert alert-danger\"";
		break;
		case "success":
			alertclass="\"alert alert-success\"";
		break;
	}
	$('#message_container #inform').remove();
	$('#message_container').append('<div id="inform" class=' + alertclass + '><small>' + message + '</small></div>');

	if(timeout) {
		setTimeout(function () {
			$('#message_container #inform').fadeOut(500, function () {
				$('#message_container #inform').remove();
			});
		}, timeout);
	}
}

// external events listeners
self.port.on("change_pass_result", function (result) {
	if(result) {
		inform("Password successfully changed", "success", 3000);
		$("#old_pass").parent().show(); //this was hidden if first password change
		$("#welcome").hide();
		$("input[type=password]").val(""); //set all fields to empty
    } else {
    	inform("Password was not changed. Is your old password correct?", "error", 5000);
    }
});

self.port.on("set_first_password", function () {
	showTab("pass");
	$("#old_pass").parent().hide();
	$(".panel").prepend("<div id=\"welcome\"><h2>Welcome to the Firefox for children extension</h2><p>Please set your parent password below:</p></div>");
});

self.port.on('current_filter', function (value) {
	$('#gen_tab input[name="filteringOptions"][value="' + value + '"]').prop('checked', true);
});

// Add elements in lists when initialization is done
self.port.on('blacklist_initialized', function (removedDefaultBlacklistElements) {
	fillListDivs([], removedDefaultBlacklistElements, 'blacklist', 'default');
});

self.port.on('default_blacklist_search_response', function (matches) {
	fillListDivs(matches, [], 'blacklist', 'default');
});

self.port.on('whitelist_initialized', function (defaultWhitelist, removedDefaultBlacklistElements) {
	fillListDivs(defaultWhitelist, removedDefaultBlacklistElements, 'whitelist', 'default');
});

self.port.on('custom_blacklist_initialized', function (list) {
	fillListDivs(list, [], 'blacklist', 'custom');
});

self.port.on('custom_whitelist_initialized', function (list) {
	fillListDivs(list, [], 'whitelist', 'custom');
});

self.port.on('blacklist_custom_added', function (host, category) {
	addCustomListListener('blacklist', host, category);
});

self.port.on('whitelist_custom_added', function (host, category) {
	addCustomListListener('whitelist', host, category);
});

self.port.on('error_null_category', function () {
	inform('Please select a category', 'error', 5000);
});

self.port.on('malformed_url', function() {
	inform('The given url is malformed', 'error', 5000);
});

self.port.on('host_already_added', function() {
	inform('The given url is already in the list', 'error', 5000);
});

self.port.on('login_log_read', function (events) {
	fillLoginReport(events);
});

self.port.on('history_log_read', function (visits) {
	fillHistoryReport(visits);
});

self.port.on('time_log_read', function (times) {
	fillTimeReport(times);
});

self.port.on('show_gen', function () {
	$('#gen').click();
});

self.port.on('time_limit_initialized', function (categories) {
	fillTimeLimitSelect(categories);
})

/**
 * Event handler when the 'add' button is clicked for custom lists
 *
 * @param {blacklist|whitelist} name of the list 
 */
function addCustomListHandler(listName) {
	var uri = window.prompt('Please enter the URL you want to add to the ' + listName + ':');
	if(uri) {
		var category = $('#custom-' + listName + '-categories select option:selected').val();
		self.port.emit('add_custom_' + listName, uri, category);
	}
}

/**
 * Event listener when an entry is added in the custom lists
 *
 * @param {blacklist|whitelist} listName
 * @param {string} host
 * @param {string} category of the added host
 */
function addCustomListListener(listName, host, category) {
	if(host) {
		var divId = 'custom-' + listName + '-category-' + category;
		if($('#' + divId).length === 0) {
			var div = $('<div>').attr('id', divId);
			$('#custom-' + listName + '-inner').append(div);
		}
		$('#' + divId).append('<input type="checkbox" id="' + host + '"/><label for="' + host + '">' + host + '</label><br/>');
	} else {
		inform('Host was not added to the ' + listName + '. Please check your syntax.', 'error');
	}
}

/**
 * This function fills the correct divs when lists are initialized
 *
 * @param {object} defaultList list of default elements
 * @param {object} removedList list of removed elements (may be empty)
 * @param {blacklist|whitelist} name of the list to be filled
 * @param {default|custom} type of the list
 */
function fillListDivs(defaultList, removedList, name, type) {
	var prefix = type + '-' + name,
		removedPrefix = '';
	fillListsDivsHelper(defaultList, prefix);
	if(removedList) {
		removedPrefix = 'removed-' + prefix;
		fillListsDivsHelper(removedList, removedPrefix);
	}

	fillMenu(defaultList, prefix, removedPrefix);
}

/**
 * This function is a helper for fillListsDivs function
 * This function shouldn't be used by any other function than fillListsDivs
 *
 * @param {object} list of elements to add
 * @param {string} prefix of id of elements
 */
function fillListsDivsHelper(list, prefix) {
	var title = $('#' + prefix + '-inner h3').detach();
	var form = $('#' + prefix + '-inner form').detach();
	$('#' + prefix + '-inner').empty().append(title).append(form);

	Object.keys(list).forEach(function (category) {
		var div = $('<div>').attr('id', prefix + '-category-' + category);
		list[category].forEach(function (elem) {
			div.append('<input type="checkbox" id="' + elem + '"/><label for="' + elem + '">' + elem + '</label><br/>');
		});
		$('#' + prefix + '-inner').append(div);
	});
	$('#' + prefix + '-inner div:not(:first)').hide();
}

/**
 * This function is a helper for fillListsDivs function.
 * It fills the menu with the categories in the given list and handles category changes
 *
 * @param {object} list of added elements
 * @param {string} prefix of id of elements
 * @param {string} prefix of the removed elements divs
 */
function fillMenu(list, prefix, removedPrefix) {
	if($('#' + prefix + '-categories select').is(':empty')) {
		Object.keys(list).forEach(function (category) {
			var option = $('<option>').attr('value', category).html(category.replace('_', ' '));
			$('#' + prefix + '-categories select').append(option);
		});
		$('#' + prefix + '-categories select').first('option').prop('selected', 'selected');
		$('#' + prefix + '-categories select').change(function () {
			$('#' + prefix + '-inner div').hide();
			$('#' + prefix + '-category-' + $(this).val()).show();
		});
		if(removedPrefix) {
			$('#' + prefix + '-categories select').change(function () {
				$('#' + removedPrefix + '-inner div').hide();
				$('#' + removedPrefix + '-category-' + $(this).val()).show();
			});
		}
	}
}

/**
 * Event handler for lists actions
 * 
 * @param {add|remove} event type
 * @param {default|custom} list type
 * @param {blacklist|whitelist} list name
 */
function listsButtonHandler(eventType, listType, listName) {
	var prefixOrigin = '',
		prefixDest = '',
		checked_elements = [],
		category = '',
		label,
		br;

	if(eventType) {
		prefixOrigin = eventType === 'add' ? 'removed-' : '';
		prefixDest = prefixOrigin === 'removed-' ? '' : 'removed-';
	}

	category = $('#' + listType + '-' + listName + '-categories option:selected').val();

	$('#' + prefixOrigin + listType + '-' + listName + '-inner input:checked').each(function(index, element) {
		checked_elements.push(element.id);
		label = $(element).next();
		br = $(element).next().next();
		if(listType === 'default') {
			$(element).attr('checked', false);
			$('#' + prefixDest + listType + '-' + listName + '-inner').append($(element)).append(label).append(br);
		} else {
			br.remove();
			label.remove();
			element.remove();
			if($('#' + listType + '-' + listName + '-category-' + category + ' input').length == 0) {
				$('#' + listType + '-' + listName + '-categories option:selected').remove();
			}
		}
	});

	self.port.emit(eventType + '_' + listType + '_' + listName, checked_elements, category);
}

/**
 * Fill login report panel
 *
 * @param {string} events of the login report
 */
function fillLoginReport(events) {
	var clearLoginLogButton = $('#clear_login_log');
	var noEventLabel = $('#login-pane #no-event');
	clearLoginLogButton.detach();
	$('#login-pane').empty().append(clearLoginLogButton).append(noEventLabel);
	
	if(events.length !== 1 || events[0] !== '') {
		$('#login-pane #no-event').hide();
		events.forEach(function (eventElement) {
			if(eventElement) {
				var eventSplit = eventElement.split(' : ');
				var timestamp = $('<b>').html(eventSplit[0] + ' : ');
				var br = $('<br>');
				var line = $('<div>').html(eventSplit[1]).prepend(timestamp).append(br);
				$('#login-pane').append(line);
			}
		});
	} else {
		$('#login-pane #no-event').show();
	}
}

/**
 * Fill history report panel
 *
 * @param array visits from the history log
 */
function fillHistoryReport(visits) {
	$('#history-pane tbody').empty();
	
	//will use this to pad date
	function pad (number) {
		return ("00" + number).slice(-2);
	}

	if(visits.length === 0) {
		$('#history-pane #visits').hide();
		$('#history-pane #no-visit').show();
	} else {
		$('#history-pane #no-visit').hide();
		$('#history-pane #visits').show();
		//for each visit found in the log add a row to the table
		visits.forEach(function (visitElement) {
			if(visitElement) {
				//prepare the data for display
				var visit = {};
				
				var visitDate = new Date(+visitElement.timestamp);
				visit.date = visitDate.getFullYear() + "-"+ 
							pad((visitDate.getMonth()+1))+ "-" +
							pad(visitDate.getDate())+" "+
							pad(visitDate.getHours())+":"+
							pad(visitDate.getMinutes());
				visit.title = visitElement.title;
				visit.url = $('<a>').attr("href",visitElement.url).html(removeUrlPrefix(visitElement.url));
				visit.url.attr("target","_blank");

				//create a row that will hold the data
				var line = $('<tr>'); 
				
				//for each attribute of the visit, create a table data element and put it in the row
				for (var name in visit) {
					if (visit.hasOwnProperty(name)) {
						line.append($('<td>').html(visit[name]));
					}
				}
				
				//append the line to the table
				$('#history-pane tbody').append(line);
			}
		});
		$("#table-history").trigger("update"); //trigger update so that tablesorter reloads the table
		$(".tablesorter-filter").addClass("form-control input-md");
	}
}

/**
 * Fill time report panel
 *
 * @param array times spent on each category
 */
function fillTimeReport(times) {
	var tableBody = $('#time-pane tbody');

	tableBody.empty();

	var oneMinute = 60,
		oneHour = oneMinute*60,
		oneDay = oneHour*24;

	Object.keys(times).forEach(function (category) {
		var line = $('<tr>');
		var categoryCell = $('<td>').html(category.replace('_', ' '));

		var timeSpent = times[category].duration;

		var days = Math.floor(timeSpent/oneDay),
			hours = Math.floor((timeSpent%oneDay)/oneHour),
			minutes = Math.floor((timeSpent%oneDay)%oneHour/oneMinute),
			seconds = Math.floor(((timeSpent%oneDay)%oneHour)%oneMinute);

		var daysString = days>0 ? days + ' day' + (days>1 ? 's ' : ' ') : '',
			hoursString = hours>0 ? hours + ' hour' + (hours>1 ? 's ' : ' ') : '',
			minutesString = minutes>0 ? minutes + ' minute' + (minutes>1 ? 's ' : ' ') : '',
			secondsString = seconds>0 ? seconds + ' second' + (seconds>1 ? 's' : '') : '';

		var timeString = daysString + hoursString + minutesString + secondsString;
		if(timeString === '') {
			timeString = 'No time spent on this category';
		}

		var timeSpentCell = $('<td>').html(timeString);

		line.append(categoryCell).append(timeSpentCell);
		tableBody.append(line);
	});
}

/*
 * Fill the select for the time limitation
 *
 * @param {array} categories to be added to the select element
 */
function fillTimeLimitSelect (timeLimits) {
	var categories = Object.keys(timeLimits);
	$('#limit_time_tab select').empty();
	if(categories.length === 0) {
		$('#limitTimeOptions').hide();
		$('#limit_time_no_category').show();
	} else {
		$('#limit_time_no_category').hide();
		$('#limitTimeOptions').show();
		categories.forEach(function (category) {
			var option = $('<option>').attr('value', category).html(category.replace('_', ' '));
			$('#limit_time_tab select').append(option);
		});

		$('#limit_time_tab select').change(function () {
			var category = $('#limit_time_tab select option:selected').val();
			$('#limit_time_tab input[name="limitTimeOptions"][value="' + timeLimits[category].limit + '"]').prop('checked', true);
		}).change();

		$('input:radio[name=limitTimeOptions]').click(function () {
			var category = $('#limit_time_tab select option:selected').val();
			self.port.emit('limit_time_choice', category, $(this).val());
		});
	}
}

function showTab(tab_choice) { //hides other content and shows chosen tab "pass","gen","lists" or "report"
	self.port.emit("tab_choice",tab_choice);
	$(".tab_container").hide();
	$(".alert").hide(); //remove leftover alerts
	$("#"+tab_choice+"_tab").show();
	$("#nav .active").removeClass("active");
	$("#"+tab_choice).addClass("active");
}

function removeUrlPrefix(url) {
	prefix = /(^https?:\/\/|www\.|\/$)/g;
	// remove any prefix
    url = url.replace(prefix, "");
	//url = url.replace(/www\/./, "");
	return url;
}
