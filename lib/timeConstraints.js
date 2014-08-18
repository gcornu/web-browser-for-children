exports.init = init;
exports.setPort = setPort;
exports.enable = enable;
exports.disable = disable;
exports.setLimit = setLimit;
exports.setHourConstraint = setHourConstraint;

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
var timerIDs = [];
var port = null;
var timeConstraintsPageMods = [];
var overOverallHourConstraintsPageModAttached = false;
var overHourConstraintsPageModAttached = new Object();

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
		overHourConstraintsPageModAttached[category] = false;
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
		timerIDs.push(timers.setInterval(checkOverallLimit, 1000));
	} else {
		timerIDs.push(timers.setInterval(checkCategoriesLimits, 1000));
	}

	if(ss.storage.useHourConstraints === true) {
		if(!ss.storage.hourConstraintsType || ss.storage.hourConstraintsType === 'overall') {
			timerIDs.push(timers.setInterval(checkOverallHourConstraints, 1000));
		} else {
			timerIDs.push(timers.setInterval(checkCategoriesHourConstraints, 1000));
		}
	}
	
}

/**
 * Disable the time constraints module
 */
function disable() {
	timerIDs.forEach(function (timerID) {
		timers.clearInterval(timerID);
	});
	
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
		attachOvertimePageMod('*',  _('over-time-limit-title'), _('over-time-limit-overall'));
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
			attachOvertimePageMod(new RegExp('^(https?|ftp):\/\/' + categoriesList[category].join('|') + '.*'),  _('over-time-limit-title'), _('over-time-limit-categories'));
		}
	});
}

/**
 * Tests if a value is in an interval
 * 
 * @param {array} the interval
 * @param {int} the value to test
 *
 * @return {boolean} whether the value is in the interval or not
 */
function isInInterval(interval, value) {
	return (value >= interval[0] && value <= interval[1]);
}

/**
 * Gives the name of the day int given
 *
 * @param {int} day integer
 * 
 * @return {string} day string associated
 */
function getDayString(dayInt) {
	var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	return days[dayInt];
}

/**
 * Check if overall hour constraints are exceeded
 */
function checkOverallHourConstraints() {
	var date = new Date();
	var timestamp = date.getHours()*60 + date.getMinutes();

	var limits = ss.storage.overallTimeConstraints.hours[getDayString(date.getDay())];
	var isInMorningInterval = limits['morning'] !== null && isInInterval(limits['morning'], timestamp);
	var isInAfternoonInterval = limits['afternoon'] !== null && isInInterval(limits['afternoon'], timestamp);

	if((isInMorningInterval || isInAfternoonInterval) && !overOverallHourConstraintsPageModAttached) {
		overOverallHourConstraintsPageModAttached = true
		attachOvertimePageMod('*',  _('over-hour-constraints-title'), _('over-hour-constraints-overall'));
	}
}

/**
 * Check if hour constraint for each category is exceeded
 */
function checkCategoriesHourConstraints() {
	var openedCategories = utils.getOpenedCategories(categoriesList);

	var date = new Date();
	var timestamp = date.getHours()*60 + date.getMinutes();

	Object.keys(openedCategories).forEach(function (category) {
		var limits = ss.storage.timeConstraints[category].hours[getDayString(date.getDay())];
		var isInMorningInterval = limits['morning'] !== null && isInInterval(limits['morning'], timestamp);
		var isInAfternoonInterval = limits['afternoon'] !== null && isInInterval(limits['afternoon'], timestamp);

		if(!(isInMorningInterval || isInAfternoonInterval) && !overHourConstraintsPageModAttached[category]) {
			overHourConstraintsPageModAttached[category] = true;
			attachOvertimePageMod(new RegExp('^(https?|ftp):\/\/' + categoriesList[category].join('|') + '.*'), _('over-hour-constraints-title'), _('over-hour-constraints-categories'));
		}
	});
}

/**
 * Attach the overtime pageMod to the given include pages
 *
 * @param {RegExp|string} uris to include
 * @param {string} title of the page
 * @param {string} message to be displayed with the pagemod
 */
function attachOvertimePageMod(include, title, message) {
	timeConstraintsPageMods.push(pageMod.PageMod({
		include: include,
		attachTo: ['existing', 'top'],
		contentScriptFile: [data.url('jquery-2.0.3.js'), data.url('overTimeConstraints.js')],
		contentScriptWhen: 'start',
		contentScriptOptions: {
			title: title,
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
	if(!ss.storage.limitTimeType || ss.storage.limitTimeType === 'overall') {
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
function setHourConstraint(category, day, period, hours) {
	if(!ss.storage.hourConstraintsType || ss.storage.hourConstraintsType === 'overall') {
		ss.storage.overallTimeConstraints.hours[day][period] = hours;
	} else {
		ss.storage.timeConstraints[category].hours[day][period] = hours;
	}
	port.emit('hour_constraint_set');
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