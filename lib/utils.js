/**
 * This package contains unspecific useful functions
 */

exports.getActiveURI = getActiveURI;

/**
 * Returns the URI of the active tab of the active window
 * 
 * @return {string} the URI of the active tab of the active window
 */
function getActiveURI() {
	var windowUtils = require('sdk/window/utils');
	var tabUtils = require('sdk/tabs/utils');
	
	// retrieve the most recenty used browser window
	var topWindow = windowUtils.getMostRecentBrowserWindow();
	
	// retrieve the active tab of this window
	var activeTab = tabUtils.getActiveTab(topWindow);
	
	// return the URI of this tab
	return tabUtils.getURI(activeTab);
}