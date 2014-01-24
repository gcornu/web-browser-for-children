var widgets = require('sdk/widget');
var windowUtils = require('sdk/window/utils');
var tabUtils = require('sdk/tabs/utils');

var blacklisting = require('blacklisting');
var whitelisting = require('whitelisting');

var widget = widgets.Widget({
	id: "file-open",
	label: "Open file",
	contentURL: "http://www.mozilla.org/favicon.ico",
	onClick: function() {
		
		
		//blacklisting.toggle();
		whitelisting.toggle();

	}
});

function getActiveURI() {
	// retrieve the most recenty used browser window
	var topWindow = windowUtils.getMostRecentBrowserWindow();
	
	// retrieve the active tab of this window
	var activeTab = tabUtils.getActiveTab(topWindow);
	
	// return the URI of this tab
	return tabUtils.getURI(activeTab);
}
