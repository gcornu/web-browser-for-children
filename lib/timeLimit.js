exports.init = init;
exports.setPort = setPort;
exports.enable = enable;
exports.disable = disable;
exports.setLimit = setLimit;

var data = require('sdk/self').data;
var timers = require('sdk/timers');
var tabs = require('sdk/tabs');
var url = require('sdk/url');
var ss = require('sdk/simple-storage');
var pageMod = require('sdk/page-mod');
var whitelisting = require('whitelisting');

var timeLimits;
var customWhitelist;
var durations = new Object();
var categories;
var timerID;
var port = null;
var timeLimitPageMods = [];

/*
 * Init the time limit module with categories
 *
 * @param {boolean} whether an event should be called after initialization or not
 */
function init(noEventEmit) {
	customWhitelist = whitelisting.getCustomWhitelist();
	categories = Object.keys(customWhitelist);
	categories.forEach(function (category) {
		durations[category] = {
			duration: 0
		};
	});

	if(!ss.storage.timeLimits) {
		ss.storage.timeLimits = new Object();
	} else {
		// remove deleted categories
		Object.keys(ss.storage.timeLimits).forEach(function (category) {
			if(categories.indexOf(category) === -1) {
				delete ss.storage.timeLimits[category];
			}
		})
	}

	timeLimits = ss.storage.timeLimits;
	var timeLimitsCategories = Object.keys(timeLimits);
	categories.forEach(function (category) {
		if(timeLimitsCategories.indexOf(category) === -1) {
			timeLimits[category] = {
				limit: 0
			};
		}
	});

	if(!noEventEmit) {
		port.emit('time_limit_initialized', timeLimits);
	}
}

/*
 * Set port for event emitting
 */
function setPort(portParam) {
	port = portParam;
}

/*
 * Enable the time limit module
 */
function enable() {
	if(!customWhitelist) {
		init(true);
	}
	timerID = timers.setInterval(checkLimits, 1000);
}

/*
 * Disable the time limit module
 */
function disable() {
	timers.clearInterval(timerID);
	timeLimitPageMods.forEach(function (timeLimitPageMod) {
		timeLimitPageMod.destroy();
	});
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

		//if limit for the category is exceeded, apply page-mod
		if(durations[category].duration == timeLimits[category].limit/**60*/) {
			timeLimitPageMods.push(pageMod.PageMod({
				include: new RegExp('^(https?|ftp):\/\/' + customWhitelist[category].join('|') + '.*'),
				attachTo: ['existing', 'top'],
				contentScriptFile: data.url('overTimeLimit.js'),
				contentScriptWhen: 'start',
				contentStyleFile: data.url('css/bootstrap.min.css'),
			}));
		}
	});
}

/*
 * Get the category of the given host
 *
 * @param {string} host whose category is requested
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

/*
 * Set the time limit for a category
 *
 * @param {string} the category to limit
 * @param {int} the value of the limit
 */
function setLimit(category, value) {
	ss.storage.timeLimits[category].limit = value;
}