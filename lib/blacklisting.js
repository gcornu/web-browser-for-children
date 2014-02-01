// module interfaces
exports.setPort = setPort;
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

// import required modules
var ss = require('sdk/simple-storage');
var data = require('sdk/self').data;
var pageMod = require('sdk/page-mod');
var url = require('sdk/url');
var fileHandler = require('fileHandler');
var utils = require('utils');

// declare variables
var blacklistPageMods = [];
var initialized = false;
var activated = false;
var previousChar = '';
var currentRegExp = '';
var defaultBlacklists = new Object();
var nBlacklists = 0;
var enabling = false;
var port = null;

/**
 * Set port for event emitting
 */
 function setPort(portParam) {
 	port = portParam;
 }

/**
 * Init blacklisting
 */
function init(enab) {
	enabling = enab;
	if(!initialized) {
		if(!ss.storage.removedDefaultBlacklistElements) {
			ss.storage.removedDefaultBlacklistElements = new Object();
		}
		// open file with default sites and apply callback
		fileHandler.streamFile('blacklist.txt', callback);
	} else if(!enabling) {
		port.emit('blacklist_initialized', getDefaultBlacklist(), getRemovedDefaultBlacklistElements());
	}
}

/**
 * Custom blacklist initialization
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
 * Callback called when reading the blacklist file (one byte at a time)
 * Stores the content of the file in the right simple storage
 * 
 * @param {string} char the current read character
 * @param {boolean} end whether the stream if finished or not
 */ 
function callback(char, end) {
	// if not begin or end of line, append the previous character 
	if((previousChar !== '\r' || char !== '\n') && previousChar !== '\n') {
		currentRegExp += previousChar;
	}
	
	// if end of line or end of stream
	if((previousChar === '\r' && char === '\n' || end) && currentRegExp !== '') {
		if(currentRegExp.charAt(0) == '[' && currentRegExp.charAt(currentRegExp.length-1) == ']') {
			currentCategory = currentRegExp.substr(1, currentRegExp.length - 2);
			currentCategory = currentCategory.replace(' ', '_');
			defaultBlacklists[currentCategory] = [[]];
			if(!ss.storage.removedDefaultBlacklistElements[currentCategory]) {
				ss.storage.removedDefaultBlacklistElements[currentCategory] = [];
			}
		} else {
			console.log(ss.storage.removedDefaultBlacklistElements);
			if(ss.storage.removedDefaultBlacklistElements[currentCategory].indexOf(currentRegExp) === -1) {
				addHostToBlacklist(currentRegExp);
			}
		}
		
		currentRegExp = '';
	}
	
	previousChar = char;
	
	if(end) {
		initialized = true;
		if(enabling) {
			createPageMods();
		} else {
			port.emit('blacklist_initialized', getDefaultBlacklist(), getRemovedDefaultBlacklistElements());
		}
	}
}

/**
* This function adds an host in the blacklist respecting array breaks
*
* @param {string} host to add
* @param {string} force the host inside a specific category
*/
function addHostToBlacklist(host, forcedCategory) {
	category = forcedCategory ? forcedCategory : currentCategory;
	// as page-mods can't contain more than 500000 elements, break array
	if(defaultBlacklists[category][nBlacklists].length >= 500000) {
		nBlacklists++;
		defaultBlacklists[category][nBlacklists] = [];
	}
	defaultBlacklists[category][nBlacklists].push(host);
}

/**
* This function searches for the host in the blacklist and removes it
*
* @param {string} host
*/
function removeHostFromBlacklist(host) {
	var categories = Object.keys(defaultBlacklists);
	for(var i = 0; i < categories.length; i++) {
		var category = categories[i];
		for(var j = 0; j < defaultBlacklists[category].length; j++) {
			var index = defaultBlacklists[category][j].indexOf(host);
			if(index === -1) {
				continue;
			} else {
				defaultBlacklists[category][j].splice(index, 1);
				if(defaultBlacklists[category][j].length === 0) {
					defaultBlacklists[category].pop();
				}
				return;
			}
		}
	}
}

/*
 * Enable the blacklisting 
 */
function enable() {
	if(!initialized) {
		init(true);
	} else {
		createPageMods();
	}
}

/**
 * This function creates the different pagemods for blacklisting
 */
function createPageMods() {
	// create a page mod to prevent the content of the blacklisted pages from displaying
	if(ss.storage.customBlacklist) {
		blacklistPageMods.push(pageMod.PageMod({
			include: ss.storage.customBlacklist,
			contentScriptFile: data.url('blacklisted.js'),
			contentScriptWhen: 'start',
		}));
	}
	
	Object.keys(defaultBlacklists).forEach(function(category) {
		defaultBlacklists[category].forEach(function(blacklist) {
			blacklistPageMods.push(pageMod.PageMod({
				include: blacklist,
				contentScriptFile: data.url('blacklisted.js'),
				contentScriptWhen: 'start',
			}));
		});
	});
	
	activated = true;
}

/**
 * Disable the blacklisting
 */
function disable() {
	// destroy every page-mod
	blacklistPageMods.forEach(function(pageMod) {
		pageMod.destroy();
	});
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
 * Getter for the flattened default blacklist
 */
function getDefaultBlacklist() {
	var flattened = new Object();
	Object.keys(defaultBlacklists).forEach(function(category) {
		var flattenedCateg = []
		flattenedCateg = flattenedCateg.concat.apply(flattenedCateg, defaultBlacklists[category]);
		flattened[category] = flattenedCateg;
	});

	return flattened;
}

/**
 * Getter for the removed elements of the blacklist
 */
function getRemovedDefaultBlacklistElements() {
	return ss.storage.removedDefaultBlacklistElements;
}

/**
 * This function adds several entries in the default blacklist by removing them from the removed elements list
 */
function addElementsToDefaultBlacklist(elements, category) {
	elements.forEach(function(element) {
		var index = ss.storage.removedDefaultBlacklistElements[category].indexOf(element);
		if(index !== -1) {
			ss.storage.removedDefaultBlacklistElements[category].splice(index, 1);
			addHostToBlacklist(element);
		} else {
			console.log('Host is not removed from default blacklist');
		}
	});
}

/**
 * This function removes several entries in the default blacklist by adding them to the removed elements list
 */
function removeElementsFromDefaultBlacklist(elements, category) {
	elements.forEach(function(element) {
		if(ss.storage.removedDefaultBlacklistElements[category].indexOf(element) === -1) {
			ss.storage.removedDefaultBlacklistElements[category].push(element);
			removeHostFromBlacklist(element);
		} else {
			console.log('Host is already removed from default blacklist');
		}
	});
}

/**
 * This function adds an element to the custom blacklist
 */
function addElementToCustomBlacklist(element, category) {
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
		var host = parsedUrl.host;
		var wildcardedHost = host.replace(/^(\w+)\.(\w+)/, '*.$2');
		// check if host is already in blacklist or not
		if(ss.storage.customBlacklist[category].indexOf(wildcardedHost) === -1) {
			ss.storage.customBlacklist[category].push(wildcardedHost);
		} else {
			console.log('Host is already in custom blacklist');
		}
	} catch(e) {
		console.log('Given URL is malformed');
		var wildcardedHost = false;
	}
	
	port.emit('blacklist_custom_added', wildcardedHost);
}

/**
 * This function allows a user to add a new site to the blacklist
 */
function addActiveURIToBlacklist() {
	addElementToCustomBlacklist(utils.getActiveURI());
}

/**
 * This function removes elements from the custom blacklist
 */
function removeElementsFromCustomBlacklist(elements, category) {
	elements.forEach(function(element) {
		var index = ss.storage.customBlacklist[category].indexOf(element);
		if(index !== -1) {
			ss.storage.customBlacklist[category].splice(index, 1);
		} else {
			console.log('Host is not in the custom blacklist');
		}
	});
}