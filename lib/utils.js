/**
 * This package contains unspecific useful functions
 */

var tabs = require('sdk/tabs');

exports.getActiveURI = getActiveURI;
exports.getTabsFromURL = getTabsFromURL;

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

/**
 * Returns tabs with the given url
 *
 * @param {string} the URL to be tested
 * @return {Array[tab]} tabs with the gievn URL
 */
function getTabsFromURL(url) {
	var res = [];
	for each(var tab in tabs) {
		if(tab.url === url) {
			res.push(tab);
		}
	}
	return res;
}