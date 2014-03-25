//begin by hiding everything in order to prevent flickering
$(".tab_container").hide();

var isActivated = false;

$(function () {
	/**
	 * Nav bar management
	 */
	"use strict";
	$("#nav > ul > li").not('#lists, #reports, #time-constraints').click(function () {
		showTab($(this).attr('id'));
	});

	/**
	 * Save button management
	 */
	$('#save').click(function () {
		if(isActivated) {
			window.alert(self.options.close_reactivate);
		}
		self.port.emit('save_settings');
	});

	/**
	 * Init dropdowns
	 */
	$('#nav .dropdown-menu li').not('.dropdown-header').click(function () {
		var tab = $(this).parent().parent().attr('id');
		var subTab = $(this).attr('id')
		showSubTab(tab, subTab);
		if(tab === 'lists') {
			// center glyphicons in buttons
			$('#lists_tab #' + list_choice + '-buttons span.glyphicon').css('margin-top', ($('#lists_tab #' + list_choice + '-buttons button').height() - $('#lists_tab #' + list_choice + '-buttons span.glyphicon').height()) / 2);
		}
	});
});

// external events listeners
self.port.on('show_filtering', function () {
	$('#filtering').click();
});

self.port.on('is_activated', function (isActivatedParam) {
	isActivated = isActivatedParam;
});

/**
 * Inform the user by displaying a message
 *
 * @param {string} the message to display
 * @param {string} type of the message (error, success...)
 * @param {int} optional param. If given, the message disappears after the timeout
 */
function inform(message, type, timeout) { //adds the message to the page in an alert div depending on type (error or success)
	var alertclass = '';
	switch(type){
		case 'error':
			alertclass = 'alert alert-danger';
		break;
		case 'success':
			alertclass = 'alert alert-success';
		break;
	}
	$('#message_container #inform').remove();
	$('#message_container').append($('<div>', {'id': 'inform', 'class': alertclass}).append($('<small>', {'text': message})));

	if(timeout) {
		setTimeout(function () {
			$('#message_container #inform').fadeOut(500, function () {
				$('#message_container #inform').remove();
			});
		}, timeout);
	}
}

/**
 * Shows the designated tab and hide any other tab
 *
 * @param {string} id of the tab to be shown
 */
function showTab(tab_choice) {
	self.port.emit("tab_choice", tab_choice);
	$(".tab_container").hide();
	//remove leftover alerts
	$(".alert").hide(); 
	$("#" + tab_choice + "-tab").show();
	$("#nav .active").removeClass("active");
	$("#" + tab_choice).addClass("active");
}

/**
 * Shows the right panel when a tab contains multiple sub-tabs
 *
 * @param {string} id of the sub-atb to be shown
 */
function showSubTab(tab, sub_tab_choice) {
	self.port.emit(tab + '_tab_choice', sub_tab_choice);
	showTab(tab);
	$('#' + tab + '-tab .' + tab + '-pane').hide();
	$('#' + tab + '-tab #' + sub_tab_choice + '-pane').show();
}