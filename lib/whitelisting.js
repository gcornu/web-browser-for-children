// module interfaces
exports.setPort = setPort;
exports.init = init;
exports.enable = enable;
exports.disable = disable;
exports.toggle = toggle;
exports.isActivated = isActivated;
exports.addElementsToDefaultWhitelist = addElementsToDefaultWhitelist;
exports.removeElementsFromDefaultWhitelist = removeElementsFromDefaultWhitelist
exports.addElementToCustomWhitelist = addElementToCustomWhitelist;
exports.addActiveURIToWhitelist = addActiveURIToWhitelist;
exports.removeElementsFromCustomWhitelist = removeElementsFromCustomWhitelist;

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
var defaultWhitelistString = '';
var defaultWhitelistRegExp = '';
var enabling = false;
var port = null;

/**
 * Set port for event emitting
 */
function setPort(portParam) {
	port = portParam;
}

/**
 * Init whitelisting
 */
function init(enab) {
	enabling = enab;
	if(!initialized) {
		if(!ss.storage.removedDefaultWhitelistElements) {
			ss.storage.removedDefaultWhitelistElements = [];
		}
		// open file with default sites and apply callback
		fileHandler.streamFile('whitelist.txt', callback);
	} else if(!enabling) {
		port.emit('whitelist_initialized', getDefaultWhitelist(), getRemovedDefaultWhitelistElements());
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
		if(ss.storage.removedDefaultWhitelistElements.indexOf(currentHost) === -1) {
			defaultWhitelistString += currentHost.replace('.', '\.') + '|';
		}
		currentHost = '';
	}
	
	previousChar = char;
	
	// init pagemod(s) if end of file
	if(end) {
		defaultWhitelistString = defaultWhitelistString.substr(0, defaultWhitelistString.length - 1);
		defaultWhitelistRegExp = createWhitelistRegExp(defaultWhitelistString);
		initialized = true;
		if(enabling) {
			createPageMods();
		} else {
			port.emit('whitelist_initialized', getDefaultWhitelist(), getRemovedDefaultWhitelistElements());
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
	if(ss.storage.customWhitelist) {
		whitelistPageMods.push(pageMod.PageMod({
			include: ss.storage.customWhitelist,
			contentScriptFile: data.url('notWhitelisted.js'),
			contentScriptWhen: 'start',
		}));
	}
	
	whitelistPageMods.push(pageMod.PageMod({
		include: defaultWhitelistRegExp,
		contentScriptFile: data.url('notWhitelisted.js'),
		contentScriptWhen: 'start',
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
	var arrayDefaultWhitelist = defaultWhitelistString.split('|');

	return arrayDefaultWhitelist;
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
function addElementsToDefaultWhitelist(elements) {
	elements.forEach(function(element) {
		var index = ss.storage.removedDefaultWhitelistElements.indexOf(element);
		element = element.replace('.', '\.');
		if(index !== -1) {
			ss.storage.removedDefaultWhitelistElements.splice(index, 1);
			defaultWhitelistString += '|' + element;
			defaultWhitelistRegExp = createWhitelistRegExp(defaultWhitelistString);
		} else {
			console.log('Host is not removed from default whitelist');
		}
	});
}

/**
 * This function removes elements from the default whitelist by adding them to the removed elements list
 */
function removeElementsFromDefaultWhitelist(elements) {
	elements.forEach(function(element) {
		if(ss.storage.removedDefaultWhitelistElements.indexOf(element) === -1) {
			ss.storage.removedDefaultWhitelistElements.push(element);
			element = element.replace('.', '\.');
			var temp = defaultWhitelistString.replace(element + '|', '');
			if(temp.length === defaultWhitelistString.length) {
				defaultWhitelistString = defaultWhitelistString.replace(element);
			} else {
				defaultWhitelistString = temp;
			}
			defaultWhitelistRegExp = createWhitelistRegExp(defaultWhitelistString);
		} else {
			console.log('Host is already removed from default whitelist');
		}
	});
}

/**
 * This function adds an element to the custom whitelist
 */
function addElementToCustomWhitelist(element) {
	// TODO : listen for overQuota
	// initialize the local storage
	if(!ss.storage.customWhitelist) {
		ss.storage.customWhitelist = [];
	}
	
	try {
		if(!/^(https?|ftp):\/\/*/.test(element)) {
			element = 'http://' + element;
		}
		var parsedUrl = url.URL(element);
		var host = parsedUrl.host;
		// check if host is already in blacklist or not
		if(ss.storage.customWhitelist.indexOf(host) === -1) {
			var regExp = createWhitelistRegExp(host.replace('.', '\.'));
			ss.storage.customWhitelist.push(regExp.toString());
		} else {
			console.log('Host is already in custom whitelist');
			host = false;
		}
	} catch(e) {
		console.log('Given URL is malformed');
		var host = false;
	}
	
	port.emit('whitelist_custom_added', host);
}

/**
 * This function allows a user to add a new site to the whitelist
 */
function addActiveURIToWhitelist() {
	addElementToCustomWhitelist(utils.getActiveURI())
}

/**
 * This function removes elements from the custom whitelist
 */
function removeElementsFromCustomWhitelist(elements) {
	elements.forEach(function(element) {
		var regExp = createWhitelistRegExp(element.replace('.', '\.'));
		var index = ss.storage.customBlacklist.indexOf(regExp.source);
		if(index !== -1) {
			ss.storage.customBlacklist.splice(index, 1);
		} else {
			console.log('Host is not in the custom blacklist');
		}
	});
}