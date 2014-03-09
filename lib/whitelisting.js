// module interfaces
exports.setPort = setPort;
exports.setInitCallback = setInitCallback;
exports.init = init;
exports.initCustomWhitelist = initCustomWhitelist;
exports.enable = enable;
exports.disable = disable;
exports.toggle = toggle;
exports.isActivated = isActivated;
exports.addElementsToDefaultWhitelist = addElementsToDefaultWhitelist;
exports.removeElementsFromDefaultWhitelist = removeElementsFromDefaultWhitelist
exports.addElementToCustomWhitelist = addElementToCustomWhitelist;
exports.addActiveURIToWhitelist = addActiveURIToWhitelist;
exports.removeElementsFromCustomWhitelist = removeElementsFromCustomWhitelist;
exports.customWhitelistCategories = customWhitelistCategories;
exports.getDefaultWhitelist = getDefaultWhitelist; // test purposes only

// import required modules
var ss = require('sdk/simple-storage');
var data = require('sdk/self').data;
var pageMod = require('sdk/page-mod');
var url = require('sdk/url');
var fileHandler = require('fileHandler');
var utils = require('utils');

// declare variables
var whitelistPageMods = [];
var activated = false;
var initialized = false;
var previousChar = '';
var currentHost = '';
var currentCategory = '';
var defaultWhitelists = new Object();
var enabling = false;
var port = null;
var initCallback = null;

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
 * Init whitelisting
 */
function init(enab) {
	enabling = enab;
	if(!initialized) {
		if(!ss.storage.removedDefaultWhitelistElements) {
			ss.storage.removedDefaultWhitelistElements = new Object;
		}
		// open file with default sites and apply callback
		fileHandler.streamFile('whitelist.txt', callback);
	} else if(!enabling) {
		port.emit('whitelist_initialized', getDefaultWhitelist(), getRemovedDefaultWhitelistElements());
	} else if(initCallback) {
		initCallback();
	}
}

/**
 * Init the custom whitelist
 */
 function initCustomWhitelist(noEventEmit) {
 	// initialize the local storage
	if(!ss.storage.customWhitelist) {
		ss.storage.customWhitelist = new Object();
	}
	if(!noEventEmit) {
		port.emit('custom_whitelist_initialized', ss.storage.customWhitelist);
	}
 }

/**
 * Callback called when reading the whitelist file (one byte at a time)
 * Stores the content of the file in the right simple storage
 * 
 * @param {string} char the current read character
 * @param {integer} end whether the stream if finished or not
 */ 
function callback(char, end) {
	// if not begin or end of line, append the previous character 
	if((previousChar !== '\r' || char !== '\n') && previousChar !== '\n') {
		currentHost += previousChar;
	}
	
	// if end of line or end of stream
	if((previousChar === '\r' && char === '\n' || end) && currentHost !== '') {
		if(currentHost.charAt(0) == '[' && currentHost.charAt(currentHost.length-1) == ']') {
			currentCategory = currentHost.substr(1, currentHost.length - 2);
			currentCategory = currentCategory.replace(' ', '_');

			defaultWhitelists[currentCategory] = [];
			if(!ss.storage.removedDefaultWhitelistElements[currentCategory]) {
				ss.storage.removedDefaultWhitelistElements[currentCategory] = [];
			}
		} else {
			if(ss.storage.removedDefaultWhitelistElements[currentCategory].indexOf(currentHost) === -1) {
				defaultWhitelists[currentCategory].push(currentHost.replace('.', '\.'));
			}
		}
		currentHost = '';
	}
	
	previousChar = char;
	
	// init pagemod if end of file
	if(end) {
		initialized = true;
		if(enabling) {
			createPageMods();
		} else {
			port.emit('whitelist_initialized', getDefaultWhitelist(), getRemovedDefaultWhitelistElements());
		}
		if(initCallback) {
			initCallback();
		}
	}
}

/**
* Create the regexp for the whitelist associated with the give string.
*/
function createWhitelistRegExp(string) {
	return new RegExp('^(https?|ftp):\/\/(?!(' + string + ')).*');
}

/*
 * Enable the whitelisting 
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
	// create a page mod to prevent the content of the not whitelisted pages from displaying
	var whitelistString = '';
	Object.keys(defaultWhitelists).forEach(function(category) {
		whitelistString += defaultWhitelists[category].join('|') + '|';
	});
	console.log(ss.storage.customWhitelist);
	var customWhitelist = ss.storage.customWhitelist;
	if(customWhitelist) {
		Object.keys(customWhitelist).forEach(function (category) {
			whitelistString += customWhitelist[category].join('|') + '|'; 
		});
	}
	whitelistString = whitelistString.substr(0, whitelistString.length - 1);
	console.log(whitelistString);
	whitelistPageMods.push(pageMod.PageMod({
		include: createWhitelistRegExp(whitelistString),
		contentScriptFile: data.url('blacklisted.js'),
		contentScriptWhen: 'start',
		contentStyleFile: data.url('css/bootstrap.min.css'),
	}));

	activated = true;
}

/**
 * Disable the blacklisting
 */
function disable() {
	// destroy the page-mod
	whitelistPageMods.forEach(function(pageMod) {
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
 * Getter for the split default whitelisting
 */
function getDefaultWhitelist() {
	return defaultWhitelists;
}

/**
 * Getter for the removed elements of the blacklist
 */
function getRemovedDefaultWhitelistElements() {
	return ss.storage.removedDefaultWhitelistElements;
}

/**
 * This function adds several entries to the default whitelist by removing them from the removed elements list
 */
function addElementsToDefaultWhitelist(elements, category) {
	elements.forEach(function(element) {
		var index = ss.storage.removedDefaultWhitelistElements[category].indexOf(element);
		element = element.replace('.', '\.');
		if(index !== -1) {
			ss.storage.removedDefaultWhitelistElements[category].splice(index, 1);
			defaultWhitelists[category].push(element);
		} else {
			throw new Error('Host is not removed from default whitelist');
		}
	});
}

/**
 * This function removes elements from the default whitelist by adding them to the removed elements list
 */
function removeElementsFromDefaultWhitelist(elements, category) {
	elements.forEach(function(element) {
		if(ss.storage.removedDefaultWhitelistElements[category].indexOf(element) === -1) {
			ss.storage.removedDefaultWhitelistElements[category].push(element);
			var index = defaultWhitelists[category].indexOf(element);
			if(index !== -1) {
				defaultWhitelists[category].splice(index, 1);
			} else {
				throw new Error('Host is not in the default whitelist');
			}
		} else {
			throw new Error('Host is already removed from default whitelist');
		}
	});
}

/**
 * This function adds an element to the custom whitelist
 */
function addElementToCustomWhitelist(element, category) {
	if(category !== null) {
		// TODO : listen for overQuota
		initCustomWhitelist(true);
		if(!ss.storage.customWhitelist[category]) {
			ss.storage.customWhitelist[category] = [];
		}
		try {
			if(!/^(https?|ftp):\/\/*/.test(element)) {
				element = 'http://' + element;
			}
			var parsedUrl = url.URL(element);
		} catch(e) {
			throw new Error('Given URL is malformed');
			var host = false;
		}

		var host = parsedUrl.host;
		// check if host is already in blacklist or not
		if(ss.storage.customWhitelist[category].indexOf(host) === -1) {
			ss.storage.customWhitelist[category].push(host);
		} else {
			throw new Error('Host is already in custom whitelist');
			host = false;
		}
		
		port.emit('whitelist_custom_added', host, category);
	} else {
		port.emit('error_null_category');
	}
}

/**
 * This function allows a user to add a new site to the whitelist
 */
function addActiveURIToWhitelist(category) {
	addElementToCustomWhitelist(utils.getActiveURI(), category)
}

/**
 * This function removes elements from the custom whitelist
 */
function removeElementsFromCustomWhitelist(elements, category) {
	elements.forEach(function(element) {
		if(ss.storage.customWhitelist[category]) {
			var index = ss.storage.customWhitelist[category].indexOf(element);
			if(index !== -1) {
				ss.storage.customWhitelist[category].splice(index, 1);
				if(ss.storage.customWhitelist[category].length === 0) {
					delete ss.storage.customWhitelist[category];
				}
			} else {
				throw new Error('Host is not in the custom whitelist');
			}
		} else {
			throw new Error('The given category contains nothing');
		}
	});
}

/**
 * Return the different categories of the custom whitelist
 */
function customWhitelistCategories() {
	initCustomWhitelist(true);
	return Object.keys(ss.storage.customWhitelist);
}