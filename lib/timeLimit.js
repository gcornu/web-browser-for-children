exports.enable = enable;

var timers = require('sdk/timers');
var tabs = require('sdk/tabs');
var url = require('sdk/url');
var whitelisting = require('whitelisting');

var customWhitelist;
var durations = new Object();
var categories;
var timerID;

function init() {
	customWhitelist = whitelisting.getCustomWhitelist();
	categories = Object.keys(customWhitelist);
	categories.forEach(function (category) {
		durations[category] = {
			duration: 0
		};
	});
}

function enable() {
	if(!customWhitelist) {
		init();
	}
	timerID = timers.setInterval(checkLimits, 1000);
}

function disable() {
	timers.clearInterval(timerID);
}

/*
 * Check if limit for each category exceeds limit
 */
function checkLimits() {
	var openedCategories = new Object();
	for each (var tab in tabs) {
		var host = url.URL(tab.url).host;
		var category = getCategory(host);
		if(category) {
			openedCategories[category] = {};
		}
	};

	Object.keys(openedCategories).forEach(function (category) {
		durations[category].duration += 1;
	});
}

/*
 * Get the category of the given host
 */
function getCategory(host) {
	var category;
	categories.some(function (element) {
		if(customWhitelist[element].indexOf(host) !== -1) {
			category = element;
			return true;
		} else {
			return false;
		}
	});
	return category;
}