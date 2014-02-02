var widgets = require("sdk/widget");
var data = require("sdk/self").data;
var password = require("password");
var blacklisting = require('blacklisting');
var whitelisting = require('whitelisting');
var panels = require("sdk/panel");
var sbtoggle = require('sbtoggle');

// these requirements should disappear
var ss = require('sdk/simple-storage');
var tbb;

exports.main = main;

function main(options) {
	"use strict";
	//Check if the password has been set by the user, if not, show prompt
	if (!password.isDefinedPassword()) {
		parentUI.settings.panel.show();
		parentUI.settings.panel.port.emit("set_first_password");
	}
	
	function buttonclick() {
		if(sbtoggle.isActivated()) {
			parentUI.auth.port.emit("ison");//tells auth form that safe browsing is now on
		} else {
			parentUI.auth.show();
		}
	}
	
	tbb = require("toolbarbutton").ToolbarButton({
		id: "FfC-start",
		label: "FfC",
		image: data.url("logo-off.png"),
		onCommand: function () {
		  	buttonclick();
		}
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

	choice_panel = panels.Panel({ //choice_panel asks the user what he wants to do
		width: 380,
		height: 150,
		contentURL: data.url("panels/choice.html"),
		contentScriptFile: [data.url("jquery-2.0.3.js"), data.url("panels/choice.js")]
	}),
		
	settings = {};
    
	settings.panel = panels.Panel({ //settings panel lets the user configure options for the extension
		width: 800,
		height: 450,
		contentURL: data.url("panels/settings.html"),
		contentScriptFile: [data.url("jquery-2.0.3.js"), data.url('js/bootstrap.min.js'), data.url("panels/settings.js")]
	});
	
	return {auth: auth_panel, choice: choice_panel, settings: settings};
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
  * Set up a button for the user to interact with the extension
*/

var widget = widgets.Widget({
	id: "settings",
	label: "Settings",
	contentURL: data.url("widget-icon.html"),
	onClick: function () {"use strict"; parentUI.auth.show(); }
});

var toggleWidget = widgets.Widget({
	id: "toggle",
	label: "Toggle list",
	contentURL: "http://www.mozilla.org/favicon.ico",
	onClick: function() {
		//ss.storage.removedDefaultBlacklistElements = ['*.wikipedia.org'];
		//blacklisting.toggle();
		//ss.storage.removedDefaultWhitelistElements = ['fr.wikipedia.org'];
		whitelisting.toggle();
	}
});

var emptyWidget = widgets.Widget({
	id: "empty-storages",
	label: "Empty storages",
	contentURL: "http://www.mozilla.org/favicon.ico",
	onClick: function() {
		delete ss.storage.customBlacklist;
		delete ss.storage.customWhitelist;
		delete ss.storage.removedDefaultBlacklistElements;
		delete ss.storage.removedDefaultWhitelistElements;
	}
});

var addBlacklistWidget = widgets.Widget({
	id: 'blacklist_add',
	label: 'Add to blacklist',
	width: 90,
	content: 'Add to blacklist',
	onClick: function() {
		blacklisting.addActiveURIToBlacklist();
	}
});

var addWhitelistWidget = widgets.Widget({
	id: 'whitelist_add',
	label: 'Add to whitelist',
	width: 90,
	content: 'Add to whitelist',
	onClick: function() {
		whitelisting.addToWhitelist();
	}
});

/**
  * Respond to events triggered by user input in the panels
*/
parentUI.auth.on("show", function () { //used to trigger some JS code in authentification.js when panel is shown
	"use strict";
	parentUI.auth.port.emit("show");
});
  
parentUI.auth.port.on("answer", function (text) { //text contains password given by user
	"use strict";
	if (password.checkPass(text)) { //Proceed and open choice_panel if password ok
		parentUI.auth.hide();
		parentUI.choice.show();
		parentUI.auth.port.emit("auth_success");
	} else {
  
	//If password was wrong, keep auth_panel open, with an error message displayed
		parentUI.auth.port.emit("auth_fail");
		//TODO : log attempt
	}
  
});

parentUI.auth.port.on("answer-unlock", function (text) { //text contains password given by user
	"use strict";
	if (password.checkPass(text)) { //Proceed and open return to regular browser if correct
		parentUI.auth.hide();
		sbtoggle.deactivate();
		parentUI.auth.port.emit("auth_success");
	} else {
  
	//If password was wrong, keep auth_panel open, with an error message displayed
		parentUI.auth.port.emit("auth_fail");
		//TODO : log attempt
	}
  
});

parentUI.choice.port.on("settings", function () { //if the user chooses settings, show him the settings panel
	"use strict";
	parentUI.choice.hide();
	parentUI.settings.panel.show();
	parentUI.settings.tabs.general(); //forces reload of the settings page
});
	
parentUI.choice.port.on("browse", function () { //if the user chooses to activate the extension...
	"use strict";
	console.log("start browsing");
	//TODO: activate child browsing here
	//start_browsing();
	sbtoggle.activate();
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
	blacklisting.setPort(parentUI.settings.panel.port);
	whitelisting.setPort(parentUI.settings.panel.port);
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

parentUI.settings.panel.port.on('remove_default_blacklist', function(elements) {
	blacklisting.removeElementsFromDefaultBlacklist(elements);
});

parentUI.settings.panel.port.on('add_default_blacklist', function(elements) {
	blacklisting.addElementsToDefaultBlacklist(elements);
});

parentUI.settings.panel.port.on('remove_default_whitelist', function(elements) {
	whitelisting.removeElementsFromDefaultWhitelist(elements);
});

parentUI.settings.panel.port.on('add_default_whitelist', function(elements) {
	whitelisting.addElementsToDefaultWhitelist(elements);
});

parentUI.settings.panel.port.on('remove_custom_blacklist', function(elements) {
	blacklisting.removeElementsFromCustomBlacklist(elements);
});

parentUI.settings.panel.port.on('add_custom_blacklist', function(uri) {
	blacklisting.addElementToCustomBlacklist(uri);
});

parentUI.settings.panel.port.on('remove_custom_whitelist', function(elements) {
	whitelisting.removeElementsFromCustomWhitelist(elements);
});

parentUI.settings.panel.port.on('add_custom_whitelist', function(uri) {
	whitelisting.addElementToCustomWhitelist(uri);
});
