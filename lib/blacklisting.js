// module interfaces
exports.setPort = setPort;
exports.setInitCallback = setInitCallback;
exports.init = init;
exports.initCustomBlacklist = initCustomBlacklist;
exports.enable = enable;
exports.disable = disable;
exports.toggle = toggle;
exports.isActivated = isActivated;
exports.addElementsToDefaultBlacklist = addElementsToDefaultBlacklist;
exports.removeElementsFromDefaultBlacklist = removeElementsFromDefaultBlacklist;
exports.addElementToCustomBlacklist = addElementToCustomBlacklist;
exports.addActiveURIToBlacklist = addActiveURIToBlacklist;
exports.removeElementsFromCustomBlacklist = removeElementsFromCustomBlacklist;
exports.customBlacklistCategories = customBlacklistCategories;
exports.searchInDefaultBlacklist = searchInDefaultBlacklist;
exports.getRemovedDefaultBlacklistElements = getRemovedDefaultBlacklistElements; //test purposes only

// import required modules
var Request = require('sdk/request').Request;
var ss = require('sdk/simple-storage');
var data = require('sdk/self').data;
var pageMod = require('sdk/page-mod');
var url = require('sdk/url');
var fileHandler = require('fileHandler');
var utils = require('utils');
var _ = require('sdk/l10n').get;

// declare variables
var blacklistPageMod = null;
var initialized = false;
var activated = false;
var defaultBlacklistCache = new Object();
var port = null;
var oldHost = '';
var oldHostBlacklisted = false;

/**
 * Set port for event emitting
 */
function setPort(portParam) {
	port = portParam;
}

function setInitCallback(cbParam) {
	initCallback = cbParam;
}

/**
 * Init blacklisting
 *
 * @param{boolean} chether an event should be emitted or not
 */
function init(noEventEmit) {
	if(!initialized) {
		initCustomBlacklist(true);
		if(!ss.storage.removedDefaultBlacklistElements) {
			ss.storage.removedDefaultBlacklistElements = new Object();
		}
		initialized = true;
	}
	if(!noEventEmit) {
		port.emit('blacklist_initialized', getRemovedDefaultBlacklistElements());
	}
}

/**
 * Custom blacklist initialization
 *
 * @param {boolean} whether an event should be emitted or not after initialisation
 */
function initCustomBlacklist(noEventEmit) {
	// initialize the local storage
	if(!ss.storage.customBlacklist) {
		ss.storage.customBlacklist = new Object();
	}
	if(!noEventEmit) {
		port.emit('custom_blacklist_initialized', ss.storage.customBlacklist);
	}
}

/**
 * This function searches for a match in the default blacklist on the server
 *
 * @param {string} query for the search
 */
function searchInDefaultBlacklist(searchQuery) {
	var request = Request({
		url: 'http://ffc.gcornu.com/search/' + encodeURI(searchQuery),
		onComplete: function (response) {
			var matches = response.json;
			var removedDefaultBlacklistElements = getRemovedDefaultBlacklistElements();
			var removedMatchesElements = new Object();

			Object.keys(matches).forEach(function (category) {
				removedMatchesElements[category] = [];
				if(removedDefaultBlacklistElements[category]) {
					removedDefaultBlacklistElements[category].forEach(function (element) {
						var index = matches[category].indexOf(element);
						if(index !== -1) {
							matches[category].splice(index, 1);
							removedMatchesElements[category].push(element);
						}
					});
				}
			});

			port.emit('default_blacklist_search_response', matches, removedMatchesElements);
		}
	});
	request.get();
}

/*
 * Enable the blacklisting 
 */
function enable() {
	if(!initialized) {
		init(true);
	}
	createPageMods();
}

/**
 * This function creates the different pagemods for blacklisting
 */
function createPageMods() {
	// create a page mod to prevent the content of the blacklisted pages from displaying
	blacklistPageMod = pageMod.PageMod({
		include: '*',
		contentScriptFile: [data.url('jquery-2.0.3.js'), data.url('blacklisted.js')],
		contentScriptOptions: {
			bootstrap_url: data.url('css/bootstrap.min.css'),
			not_allowed: _('blacklisted-not-allowed'),
		},
		contentScriptWhen: 'start',
		onAttach: function (worker) {
			var host = url.URL(worker.tab.url).host;
			var wildcardedHost = host.replace(/^(\w+)\.(\w+)/, '*.$2');
			host = host.replace(/www\./, '');
			if(host !== oldHost) {
				if(isInList(wildcardedHost, ss.storage.customBlacklist)) {
					console.log('host in custom blacklist');
					denyPage(worker, true);
					oldHostBlacklisted = true;
				} else if(isInList(host, ss.storage.removedDefaultBlacklistElements)) {
					console.log('host in removed default blacklist');
					denyPage(worker, false);
					oldHostBlacklisted = false;
				} else if(host in defaultBlacklistCache) {
					console.log('host in cache');
					denyPage(worker, defaultBlacklistCache[host]);
					oldHostBlacklisted = defaultBlacklistCache[host];
				} else {
					console.log('request with host ' + host);
					var request = Request({
						url: 'http://ffc.gcornu.com/query/' + host,
						onComplete: function (response) {
							console.log('response: ' + response.json);
							denyPage(worker, response.json);
							oldHostBlacklisted = response.json;
							defaultBlacklistCache[host] = response.json;
						}
					});
					request.get();
				}
				oldHost = host;
			} else {
				denyPage(worker, oldHostBlacklisted);
			}
		}
	});
	
	activated = true;
}

/**
 * Send event to attached script telling if the host is blacklisted or not
 *
 * @param {worker} worker of the attached page-mod
 * @param {boolean} whereas the page is blacklisted or not
 */
function denyPage(worker, deny) {
	if(deny) {
		worker.port.emit('deny');
	} else {
		worker.port.emit('allow');
	}
}

/**
 * Test if the given host is in the given list or not
 *
 * @param {String} the host to be tested
 * @param {Object} the list to be searched in
 */
function isInList(host, list) {
	var BreakException= {};
	try {
	    Object.keys(list).forEach(function (category) {
			if(list[category].indexOf(host) !== -1) {
				throw BreakException;
			}
		});
	} catch(e) {
		if (e !== BreakException) {
			throw e;
		} else {
			return true;
		}
	}
	return false;
}

/**
 * Disable the blacklisting
 */
function disable() {
	// destroy every page-mod
	if(blacklistPageMod) {
		blacklistPageMod.destroy();
	}
	activated = false;
}

/**
 * Test if the blacklisting is activated
 * 
 * @returns {boolean} activated
 */
function isActivated() {
	return activated;
}

/**
 * Toggle the blacklisting
 */
function toggle() {
	if(!isActivated()) {
		// if not activated, enable
		enable();
	} else {
		// else disable
		disable();
	}
}

/**
 * Getter for the removed elements of the blacklist
 */
function getRemovedDefaultBlacklistElements() {
	return ss.storage.removedDefaultBlacklistElements;
}

/**
 * This function adds several entries in the default blacklist by removing them from the removed elements list
 *
 * @param {array[string]} elements to be added
 * @param {string} category of the elements to be added 
 */
function addElementsToDefaultBlacklist(elements, category) {
	if(!ss.storage.removedDefaultBlacklistElements[category]) {
		ss.storage.removedDefaultBlacklistElements[category] = [];
	}
	elements.forEach(function (element) {
		var index = ss.storage.removedDefaultBlacklistElements[category].indexOf(element);
		if(index !== -1) {
			ss.storage.removedDefaultBlacklistElements[category].splice(index, 1);
		} else {
			throw new Error('Host is not removed from default blacklist');
		}
	});
}

/**
 * This function removes several entries in the default blacklist by adding them to the removed elements list
 *
 * @param {array[string]} elements to be removed
 * @param {string} category of the elements to be removed 
 */
function removeElementsFromDefaultBlacklist(elements, category) {
	if(!ss.storage.removedDefaultBlacklistElements[category]) {
		ss.storage.removedDefaultBlacklistElements[category] = [];
	}
	elements.forEach(function (element) {
		if(ss.storage.removedDefaultBlacklistElements[category].indexOf(element) === -1) {
			ss.storage.removedDefaultBlacklistElements[category].push(element);
		} else {
			throw new Error('Host is already removed from default blacklist');
		}
	});
}

/**
 * This function adds an element to the custom blacklist
 */
function addElementToCustomBlacklist(element, category) {
	if(category !== null) {
		// TODO : listen for overQuota
		initCustomBlacklist(true);
		if(!ss.storage.customBlacklist[category]) {
			ss.storage.customBlacklist[category] = [];
		}
		try {
			if(!/^(https?|ftp):\/\/*/.test(element)) {
				element = 'http://' + element;
			}
			var parsedUrl = url.URL(element);
		} catch(e) {
			port.emit('malformed_url');
			return;
		}

		var host = parsedUrl.host;
		if(/^(\w+)\.(\w+)\.(\w+)/.test(host)) {
			var wildcardedHost = host.replace(/^(\w+)\.(\w+)\.(\w+)/, '*.$2.$3');
		} else {
			var wildcardedHost = '*.' + host;
		}
		
		// check if host is already in blacklist or not
		if(ss.storage.customBlacklist[category].indexOf(wildcardedHost) === -1) {
			ss.storage.customBlacklist[category].push(wildcardedHost);
		} else {
			port.emit('host_already_added');
			return;
		}

		port.emit('blacklist_custom_added', wildcardedHost, category);
	} else {
		port.emit('error_null_category');
	}
}

/**
 * This function allows a user to add a new site to the blacklist
 */
function addActiveURIToBlacklist(category) {
	addElementToCustomBlacklist(utils.getActiveURI(), category);
}

/**
 * This function removes elements from the custom blacklist
 */
function removeElementsFromCustomBlacklist(elements, category) {
	elements.forEach(function(element) {
		if(ss.storage.customBlacklist[category]) {
			var index = ss.storage.customBlacklist[category].indexOf(element);
			if(index !== -1) {
				ss.storage.customBlacklist[category].splice(index, 1);
				if(ss.storage.customBlacklist[category].length === 0) {
					delete ss.storage.customBlacklist[category];
				}
			} else {
				throw new Error('Host is not in the custom blacklist');
			}
		} else {
			throw new Error('The given category contains nothing');
		}
	});
}

/**
 * Return the different categories of the custom blacklist
 */
function customBlacklistCategories() {
	initCustomBlacklist(true);
	return Object.keys(ss.storage.customBlacklist);
}