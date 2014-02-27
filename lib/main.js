var widgets = require("sdk/widget");
var data = require("sdk/self").data;
var password = require("password");
var logs = require('logs');
var blacklisting = require('blacklisting');
var whitelisting = require('whitelisting');
var panels = require("sdk/panel");
var sbtoggle = require('sbtoggle');
var favorites = require("favorites");

// these requirements should disappear
var ss = require('sdk/simple-storage');
var tbb, menu_panel;

exports.main = main;

function main(options) {
	"use strict";
	//Check if the password has been set by the user, if not, show prompt
	if (!password.isDefinedPassword()) {
		parentUI.settings.panel.show();
		parentUI.settings.panel.port.emit("set_first_password");
	}
	
	blacklisting.setPort(parentUI.settings.panel.port);
	whitelisting.setPort(parentUI.settings.panel.port);
	logs.setPort(parentUI.settings.panel.port);
	
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
			parentUI.auth.port.emit("isoff"); //tells auth form that safe browsing is now on
			parentUI.auth.show();
		}
	});

	menu_panel.port.on('deactivate', function () {
		if(sbtoggle.isActivated()) {
			parentUI.auth.port.emit("ison"); //tells auth form that safe browsing is now off
			parentUI.auth.show();
		}
	});

	menu_panel.port.on('options', function () {
		parentUI.auth.port.emit("options"); //tells auth form that options panel should be shown next
		parentUI.auth.show();
	});

	if (options.loadReason == "install") {
		tbb.moveTo({
			toolbarID: "nav-bar",
			forceMove: false // only move from palette
		});
	}
}

/**
  * This section initializes the different panels used by the extension
*/
var parentUI = (function () { //set up all the necessary panels in a "parentUI" object
	"use strict";
	var auth_panel = panels.Panel({ //auth_panel is used to ask the user for his password before proceeding
		width: 300,
		height: 200,
		contentURL: data.url("panels/authentification.html"),
		contentScriptFile: [data.url("jquery-2.0.3.js"), data.url("panels/authentification.js")]
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
        
	var settings = {};
    
	settings.panel = panels.Panel({ //settings panel lets the user configure options for the extension
		width: 800,
		height: 450,
		contentURL: data.url("panels/settings.html"),
		contentScriptFile: [data.url("jquery-2.0.3.js"), data.url('js/bootstrap.min.js'), data.url('js/jquery.tablesorter.min.js'),data.url('js/jquery.tablesorter.widgets.min.js'),data.url('js/jquery.tablesorter.pager.min.js'),data.url("panels/settings.js")]
	});

	return {auth: auth_panel, settings: settings, add_list: add_list};
}());

/**
  * This section defines actions to do on tab switch within the settings panel
*/

parentUI.settings.tabs = (function () { //do stuff when tabs are clicked
	"use strict";
	var generalTab = function () { //if the user clicks on the settings:general tab, put general form in panel content
		//parentUI.settings.panel.contentURL = data.url("panels/settings.html");

		//send information to preselect current filter setting
		parentUI.settings.panel.port.emit("current_filter", ss.storage.filter);
	},
		
	passwordTab = function () {
		//parentUI.settings.panel.contentURL = data.url("panels/settings.html");
	},

	listsTab = function () {
		//parentUI.settings.panel.contentURL = data.url("panels/settings.html");
	},

	reportsTab = function () {
		//parentUI.settings.panel.contentURL = data.url("panels/settings.html");
	};
			
	return {general: generalTab, password: passwordTab, lists: listsTab, reports: reportsTab};
}());

/**
  * Respond to events triggered by user input in the panels
*/
parentUI.auth.on("show", function () { //used to trigger some JS code in authentification.js when panel is shown
	"use strict";
	parentUI.auth.port.emit("show");
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
 * Manage password answer
 *
 * @param {string} the password answer
 */
function passwordAnswer(text, param) {
	"use strict";
	var success;
	if (password.checkPass(text)) { //Proceed and open choice_panel if password ok
		success = true;
		parentUI.auth.hide();
		switch(param) {
			case 'lock':
				sbtoggle.activate();
				menu_panel.port.emit('activated');
				break;
			case 'unlock':
				sbtoggle.deactivate();
				menu_panel.port.emit('deactivated');
				break;
			case 'options':
				parentUI.settings.panel.show();
				parentUI.settings.tabs.general(); //forces reload of the settings page
				break;
			default:
				 parentUI.choice.show();
				 break;
		}
		parentUI.auth.port.emit("auth_success");
	} else {
  		success = false;
		//If password was wrong, keep auth_panel open, with an error message displayed
		parentUI.auth.port.emit("auth_fail");
	}
  	
  	logs.addToLoginLog(success);
}

parentUI.add_list.blacklist.on('show', function() {
	"use strict";
	parentUI.add_list.blacklist.port.emit('categories', blacklisting.customBlacklistCategories());
});

parentUI.add_list.blacklist.port.on('add_blacklist', function(category) {
	"use strict";
	blacklisting.addActiveURIToBlacklist(category);
	parentUI.add_list.blacklist.hide();
});

parentUI.add_list.whitelist.on('show', function() {
	"use strict";
	parentUI.add_list.whitelist.port.emit('categories', whitelisting.customWhitelistCategories());
});

parentUI.add_list.whitelist.port.on('add_whitelist', function(category) {
	"use strict";
	console.log(category);
	whitelisting.addActiveURIToWhitelist(category);
	parentUI.add_list.whitelist.hide();
});

parentUI.settings.panel.on('show', function () {
	parentUI.settings.panel.port.emit('force_update');
});

parentUI.settings.panel.port.on("tab_choice", function (choice) {
	"use strict";
	switch (choice) {
		case "gen":
			parentUI.settings.tabs.general();
			break;
		case "pass":
			parentUI.settings.tabs.password();
			break;
		case "lists":
			parentUI.settings.tabs.lists();
			break;
		case "reports":
			parentUI.settings.tabs.reports();
			break;
	}
});

parentUI.settings.panel.port.on("password_done", function () {
	"use strict";
	parentUI.settings.panel.hide();
	//parentUI.settings.panel.contentURL = data.url("panels/settings.html"); //reload the settings page
});

parentUI.settings.panel.port.on("update_pass", function (pwords) {
	"use strict";
	//this is triggered when the user submits the change password form in the settings
	var result = password.changePass(pwords.oldpass, pwords.newpass);
	parentUI.settings.panel.port.emit("change_pass_result", result); //
});

parentUI.settings.panel.port.on('filter', function(val) { //update filtering settings
	ss.storage.filter = val;
});

// Init lists when tabs are clicked
parentUI.settings.panel.port.on('lists_tab_choice', function(val) {
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

parentUI.settings.panel.port.on('remove_default_blacklist', function(elements, category) {
	blacklisting.removeElementsFromDefaultBlacklist(elements, category);
});

parentUI.settings.panel.port.on('add_default_blacklist', function(elements, category) {
	blacklisting.addElementsToDefaultBlacklist(elements, category);
});

parentUI.settings.panel.port.on('remove_default_whitelist', function(elements, category) {
	whitelisting.removeElementsFromDefaultWhitelist(elements, category);
});

parentUI.settings.panel.port.on('add_default_whitelist', function(elements, category) {
	whitelisting.addElementsToDefaultWhitelist(elements, category);
});

parentUI.settings.panel.port.on('remove_custom_blacklist', function(elements, category) {
	blacklisting.removeElementsFromCustomBlacklist(elements, category);
});

parentUI.settings.panel.port.on('add_custom_blacklist', function(uri, category) {
	blacklisting.addElementToCustomBlacklist(uri, category);
});

parentUI.settings.panel.port.on('remove_custom_whitelist', function(elements, category) {
	whitelisting.removeElementsFromCustomWhitelist(elements, category);
});

parentUI.settings.panel.port.on('add_custom_whitelist', function(uri, category) {
	whitelisting.addElementToCustomWhitelist(uri, category);
});

// Init lists when tabs are clicked
parentUI.settings.panel.port.on('reports_tab_choice', function(val) {
	'use strict';
	switch(val) {
		case 'login':
			logs.getLoginLog();
			break;
		case 'history':
			logs.getHistoryLog();
			break;
	}
});