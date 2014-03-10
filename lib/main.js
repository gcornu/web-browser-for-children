var widgets = require("sdk/widget");
var data = require("sdk/self").data;
var password = require("password");
var logs = require('logs');
var blacklisting = require('blacklisting');
var whitelisting = require('whitelisting');
var utils = require('utils');
var panels = require("sdk/panel");
var tabs = require('sdk/tabs');
var tabsUtils = require('sdk/tabs/utils');
var pageMod = require('sdk/page-mod');
var ss = require('sdk/simple-storage');
var sbtoggle = require('sbtoggle');
var timeLimit = require('timeLimit');

var tbb,
	menu_panel,
	settings_worker,
	authenticated = false;

exports.main = main;

function main(options) {
	"use strict";

	//Check if the password has been set by the user, if not, show prompt
	if(!password.isDefinedPassword()) {
		authenticated = true;
		tabs.open(data.url('panels/settings.html'));
	}
	
	menu_panel = panels.Panel({
		width: 200,
		height: 96,
		contentURL: data.url("panels/menu.html"),
		contentScriptFile: [data.url("jquery-2.0.3.js"), data.url("panels/menu.js")],
	});

	tbb = require("toolbarbutton").ToolbarButton({
		id: "FfC-start",
		label: "FfC",
		image: data.url("logo-off.png"),
		panel: menu_panel
	});

	menu_panel.port.on('addBlacklist', function () {
		parentUI.add_list.blacklist.show();
	});

	menu_panel.port.on('addWhitelist', function () {
		parentUI.add_list.whitelist.show();
	});
	
	menu_panel.port.on('activate', function () {
		if(!sbtoggle.isActivated()) {
			if(!authenticated) {
				parentUI.auth.port.emit("isoff"); //tells auth form that safe browsing is now on
				parentUI.auth.show();
			} else {
				menu_panel.hide();
				activateSafeBrowsing();
			}
			authenticated = false;
		}
	});

	menu_panel.port.on('deactivate', function () {
		if(sbtoggle.isActivated()) {
			parentUI.auth.port.emit("ison"); //tells auth form that safe browsing is now off
			parentUI.auth.show();
		}
	});

	menu_panel.port.on('options', function () {
		if(!authenticated) {
			parentUI.auth.port.emit("options"); //tells auth form that options panel should be shown next
			parentUI.auth.show();
		} else {
			menu_panel.hide();
			openSettingsTab();
		}
	});

	tbb.moveTo({
		toolbarID: "nav-bar",
		forceMove: false // only move from palette
	});
	
	// if safe navigation is enabled, disable it
	if(sbtoggle.isActivated()) {
		sbtoggle.deactivate();
	}

	pageMod.PageMod({
		include: data.url('panels/settings.html'),
		contentScriptFile: [
  			data.url('jquery-2.0.3.js'), 
			data.url('js/bootstrap.min.js'), 
			data.url('js/jquery.tablesorter.min.js'), 
			data.url('js/jquery.tablesorter.widgets.min.js'), 
			data.url('js/jquery.tablesorter.pager.min.js'), 
			data.url('panels/settings.js')
		],
		onAttach: function (worker) {
			worker.tab.on('close', function () {
				authenticated = false;
			});
			if(!authenticated) {
				worker.tab.close();
			}
			if(!password.isDefinedPassword()) {
				worker.port.emit('set_first_password');
			} else {
				worker.port.emit('show_gen');
			}
			blacklisting.setPort(worker.port);
			whitelisting.setPort(worker.port);
			logs.setPort(worker.port);
			timeLimit.setPort(worker.port);
			attachSettingsListeners(worker);
			settings_worker = worker;
		}
	});
}

/**
 * This section initializes the different panels used by the extension
 */
var parentUI = (function () { //set up all the necessary panels in a "parentUI" object
	"use strict";
	var auth_panel = panels.Panel({ //auth_panel is used to ask the user for his password before proceeding
		width: 300,
		height: 200,
		contentURL: data.url("panels/authentication.html"),
		contentScriptFile: [data.url("jquery-2.0.3.js"), data.url("panels/authentication.js")]
	}),

	add_list = {};

	add_list.blacklist = panels.Panel({
		width: 300,
		height: 200,
		contentURL: data.url('panels/addList.html'),
		contentScriptFile: [data.url("jquery-2.0.3.js"), data.url("panels/addBlackist.js")]
	});

	add_list.whitelist = panels.Panel({
		width: 300,
		height: 200,
		contentURL: data.url('panels/addList.html'),
		contentScriptFile: [data.url("jquery-2.0.3.js"), data.url("panels/addWhitelist.js")]
	});

	return {auth: auth_panel, add_list: add_list};
}());

/**
 * Respond to events triggered by user input in the panels
 */ 
parentUI.auth.on('show', function () {
	parentUI.auth.port.emit('show');
});

parentUI.auth.port.on("answer", function (text) { //text contains password given by user
	passwordAnswer(text);
});

parentUI.auth.port.on("answer-lock", function (text) { //text contains password given by user
	passwordAnswer(text, 'lock');
});

parentUI.auth.port.on("answer-unlock", function (text) { //text contains password given by user
	passwordAnswer(text, 'unlock');
});

parentUI.auth.port.on("answer-options", function (text) { //text contains password given by user
	passwordAnswer(text, 'options');
});

/**
 * Open the settings tab
 */
function openSettingsTab() {
	var settingsTabs = utils.getTabsFromURL(data.url('panels/settings.html'));
	if(settingsTabs.length === 0) {
		tabs.open(data.url('panels/settings.html'));
	} else {
		settingsTabs[0].activate();
	}
}

/**
 * Manage password answer
 *
 * @param {string} the password answer
 */
function passwordAnswer(text, param) {
	"use strict";
	var success;
	if(password.checkPass(text)) { //Proceed and open choice_panel if password ok
		success = true;
		parentUI.auth.hide();
		switch(param) {
			case 'lock':
				activateSafeBrowsing();
				break;
			case 'unlock':
				sbtoggle.deactivate();
				menu_panel.port.emit('deactivated');
				break;
			case 'options':
				openSettingsTab();
				break;
		}
		parentUI.auth.port.emit("auth_success");
	} else {
  		success = false;
		//If password was wrong, keep auth_panel open, with an error message displayed
		parentUI.auth.port.emit("auth_fail");
	}
  	authenticated = success;
  	logs.addToLoginLog(success);
}

function activateSafeBrowsing() {
	// close options tab if opened
	if(settings_worker.tab) {
		settings_worker.tab.close();
	}
	sbtoggle.activate();
	menu_panel.port.emit('activated');
}

parentUI.add_list.blacklist.on('show', function () {
	"use strict";
	parentUI.add_list.blacklist.port.emit('categories', blacklisting.customBlacklistCategories());
});

parentUI.add_list.blacklist.port.on('add_blacklist', function(category) {
	"use strict";
	blacklisting.addActiveURIToBlacklist(category);
	parentUI.add_list.blacklist.hide();
});

parentUI.add_list.whitelist.on('show', function () {
	"use strict";
	parentUI.add_list.whitelist.port.emit('categories', whitelisting.customWhitelistCategories());
});

parentUI.add_list.whitelist.port.on('add_whitelist', function (category) {
	"use strict";
	whitelisting.addActiveURIToWhitelist(category);
	parentUI.add_list.whitelist.hide();
});

function attachSettingsListeners(worker) {
	worker.port.on('save_settings', function () {
		worker.tab.close();
	});

	worker.port.on("tab_choice", function (choice) {
		"use strict";
		switch (choice) {
			case "gen":
				worker.port.emit("current_filter", ss.storage.filter);
				break;
			case "pass":
				break;
			case "lists":
				break;
			case "reports":
				break;
		}
	});

	worker.port.on("update_pass", function (pwords) {
		"use strict";
		//this is triggered when the user submits the change password form in the settings
		var result = password.changePass(pwords.oldpass, pwords.newpass);
		worker.port.emit("change_pass_result", result); //
	});

	worker.port.on('filter', function (val) { //update filtering settings
		if(['none', 'wlist', 'blist'].indexOf(val) !== -1) {
			ss.storage.filter = val;
		}
	});

	// Init lists when tabs are clicked
	worker.port.on('lists_tab_choice', function (val) {
		'use strict';
		switch(val) {
			case 'default_blacklist':
				blacklisting.init();
				break;
			case 'default_whitelist':
				whitelisting.init();
				break;
			case 'custom_blacklist':
				blacklisting.initCustomBlacklist();
				break;
			case 'custom_whitelist':
				whitelisting.initCustomWhitelist();
				break;
		}
	});

	worker.port.on('remove_default_blacklist', function (elements, category) {
		blacklisting.removeElementsFromDefaultBlacklist(elements, category);
	});

	worker.port.on('add_default_blacklist', function (elements, category) {
		blacklisting.addElementsToDefaultBlacklist(elements, category);
	});

	worker.port.on('remove_default_whitelist', function (elements, category) {
		whitelisting.removeElementsFromDefaultWhitelist(elements, category);
	});

	worker.port.on('add_default_whitelist', function (elements, category) {
		whitelisting.addElementsToDefaultWhitelist(elements, category);
	});

	worker.port.on('remove_custom_blacklist', function (elements, category) {
		blacklisting.removeElementsFromCustomBlacklist(elements, category);
	});

	worker.port.on('add_custom_blacklist', function (uri, category) {
		blacklisting.addElementToCustomBlacklist(uri, category);
	});

	worker.port.on('remove_custom_whitelist', function (elements, category) {
		whitelisting.removeElementsFromCustomWhitelist(elements, category);
	});

	worker.port.on('add_custom_whitelist', function (uri, category) {
		whitelisting.addElementToCustomWhitelist(uri, category);
	});

	// Init lists when tabs are clicked
	worker.port.on('reports_tab_choice', function (val) {
		'use strict';
		switch(val) {
			case 'login':
				logs.getLoginLog();
				break;
			case 'history':
				logs.getHistoryLog();
				break;
			case 'time':
				logs.getTimeLog();
				break;
		}
	});

	// Clear logs
	worker.port.on('clear_log', function (logType) {
		'use strict';
		switch(logType) {
			case 'login':
				logs.clearLoginLog();
				break;
			case 'history':
				logs.clearHistoryLog();
				break;
			case 'time':
				logs.clearTimeLog();
				break;
		}
	});

	worker.port.on('limit_time_tab_clicked', function () {
		timeLimit.init();
	});

	worker.port.on('limit_time_choice', function (category, value) {
		timeLimit.setLimit(category, value);
	})
}