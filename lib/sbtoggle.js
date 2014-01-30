/**
  * This module activates safe browsing
*/

exports.activate = activate;
exports.deactivate = deactivate;
exports.isActivated = isActivated;

var ss = require('sdk/simple-storage');

function activate() {
	toggle(true);
}

function isActivated() {
	return ss.storage.isActivated;
}

function deactivate() {
	toggle(false);
}

function toggle(boolvalue) {
	var topWindow = require('sdk/window/utils').getMostRecentBrowserWindow().content;
	topWindow.fullScreen = boolvalue;
	ss.storage.isActivated = boolvalue;
}