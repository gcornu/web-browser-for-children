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
var utils = require('utils');
var _ = require('sdk/l10n').get;

var timeConstraints;
var categoriesList;
var durations = new Object();
var duration = 0;
var categories;
var timerID;
var port = null;
var timeConstraintsPageMods = [];

/**
 * Init the time limit module with categories
 *
 * @param {boolean} whether an event should be called after initialization or not
 */
function init(noEventEmit) {
	duration = 0;

	if(!ss.storage.overallTimeConstraints) {
		ss.storage.overallTimeConstraints = {
			limit: 0,
			hours: createWeekObject()
		}
	}

	categoriesList = whitelisting.getCustomWhitelist();
	categories = Object.keys(categoriesList);
	categories.forEach(function (category) {
		durations[category] = {
			duration: 0
		};
	});

	if(!ss.storage.timeConstraints) {
		ss.storage.timeConstraints = new Object();
	} else {
		// remove deleted categories
		Object.keys(ss.storage.timeConstraints).forEach(function (category) {
			if(categories.indexOf(category) === -1) {
				delete ss.storage.timeConstraints[category];
			}
		})
	}

	timeConstraints = ss.storage.timeConstraints;
	var timeConstraintsCategories = Object.keys(timeConstraints);
	categories.forEach(function (category) {
		if(timeConstraintsCategories.indexOf(category) === -1) {
			timeConstraints[category] = {
				limit: 0,
				hours: createWeekObject()
			};
		}
	});

	if(!noEventEmit) {
		port.emit('time_constraints_initialized', timeConstraints, ss.storage.overallTimeConstraints);
	}
}

/**
 * Set port for event emitting
 */
function setPort(portParam) {
	port = portParam;
}

/**
 * Enable the time limit module
 */
function enable() {
	init(true);
	
	if(ss.storage.limitTimeType === 'overall') {
		timerID = timers.setInterval(checkOverallLimit, 1000);
	} else {
		timerID = timers.setInterval(checkCategoriesLimits, 1000);
	}
}

/**
 * Disable the time limit module
 */
function disable() {
	timers.clearInterval(timerID);
	timeConstraintsPageMods.forEach(function (timeConstraintsPageMod) {
		timeConstraintsPageMod.destroy();
	});
}

/**
 * Check if overall limit is exceeded
 */
function checkOverallLimit() {
	duration += 1;
	if(duration == ss.storage.overallTimeConstraints.limit*60) {
		attachOvertimePageMod('*', _('over-time-limit-overall'));
	}
}

/**
 * Check if limit for each category exceeds limit
 */
function checkCategoriesLimits() {
	var openedCategories = utils.getOpenedCategories(categoriesList);

	Object.keys(openedCategories).forEach(function (category) {
		durations[category].duration += 1;

		//if limit for the category is exceeded, apply page-mod
		if(durations[category].duration == timeConstraints[category].limit*60) {
			attachOvertimePageMod(new RegExp('^(https?|ftp):\/\/' + categoriesList[category].join('|') + '.*'), _('over-time-limit-categories'));
		}
	});
}

/**
 * Attach the overtime pageMod to the given include pages
 *
 * @param {RegExp|string} uris to include
 * @param {string} message to be displayed with the pagemod
 */
function attachOvertimePageMod(include, message) {
	timeConstraintsPageMods.push(pageMod.PageMod({
		include: include,
		attachTo: ['existing', 'top'],
		contentScriptFile: data.url('overTimeLimit.js'),
		contentScriptWhen: 'start',
		contentScriptOptions: {
			message: message,
		},
		contentStyleFile: data.url('css/bootstrap.min.css'),
	}));
}

/**
 * Set the time limit for a category
 *
 * @param {string} the category to limit
 * @param {int} the value of the limit
 */
function setLimit(category, value) {
	if(ss.storage.limitTimeType === 'overall') {
		ss.storage.overallTimeConstraints.limit = value;
	} else {
		ss.storage.timeConstraints[category].limit = value;
	}
	port.emit('time_limit_set');
}

/**
 * Set the authorized hours for the given category
 *
 * @param {string} the category to set hours to
 * @param {string} day of the week
 * @param {string} morning or afternoon hours
 */
function setHours(category, day, period, hours) {
	if(ss.storage.hoursConstraintsType === 'overall') {
		ss.storage.overallTimeConstraints.hours[day][period] = hours;
	} else {
		ss.storage.timeConstraints[category].hours[day][period] = value;
	}
	port.emit('hours_constraints_set');
}

/**
 * Creates the week object with every day of the week and periods attached
 */
function createWeekObject() {
	return {
		'monday': {
			'morning': null,
			'afternoon': null
		},
		'tuesday': {
			'morning': null,
			'afternoon': null
		},
		'wednesday': {
			'morning': null,
			'afternoon': null
		},
		'thursday': {
			'morning': null,
			'afternoon': null
		},
		'friday': {
			'morning': null,
			'afternoon': null
		},
		'saturday': {
			'morning': null,
			'afternoon': null
		},
		'sunday': {
			'morning': null,
			'afternoon': null
		},
	}
}