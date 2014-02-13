/**
  * This module activates safe browsing
*/

exports.activate = activate;
exports.deactivate = deactivate;
exports.isActivated = isActivated;

var ss = require('sdk/simple-storage');
var data = require("sdk/self").data;
var logs = require('logs');

function activate() {
	toggle(true);
	logs.startHistoryLogging();
}

function isActivated() {
	return ss.storage.isActivated;
}

function deactivate() {
	toggle(false);
	logs.stopHistoryLogging();
}

function toggle(boolvalue) {
	var window = require('sdk/window/utils').getMostRecentBrowserWindow();
	var topWindow = window.content;
	topWindow.fullScreen = boolvalue;
	ss.storage.isActivated = boolvalue;
	var url = (boolvalue) ? "logo-on.png" : "logo-off.png";
	(window.document.getElementById("FfC-start")).image = data.url(url);
	
	//if(boolvalue) {
		switch(ss.storage.filter) {
			case "wlist":
				require('whitelisting').toggle();
			case "blist":
				require('blacklisting').toggle();
		}
	//}
}