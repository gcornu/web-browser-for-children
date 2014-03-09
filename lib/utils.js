/**
 * This package contains unspecific useful functions
 */

exports.getActiveURI = getActiveURI;
exports.getCategory = getCategory;
exports.getOpenedCategories = getOpenedCategories;

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
 * Get the category of the given host
 *
 * @param {string} host whose category is requested
 * @param {Array} the categories
 */
function getCategory(host, list) {
	var categories = Object.keys(list);
	var category;
	categories.some(function (element) {
		if(list[element].indexOf(host) !== -1) {
			category = element;
			return true;
		} else {
			return false;
		}
	});
	return category;
}

/**
 * Get the opened categories (at least one tab opened )
 */
function getOpenedCategories(list) {
	var tabs = require('sdk/tabs');
	var url = require('sdk/url');
	var openedCategories = new Object();
	for each (var tab in tabs) {
		var host = url.URL(tab.url).host;
		var category = getCategory(host, list);
		if(category) {
			openedCategories[category] = {};
		}
	};

	return openedCategories;
}