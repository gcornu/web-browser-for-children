// module interfaces
exports.enable = enable;
exports.disable = disable;
exports.toggle = toggle;
exports.isActivated = isActivated;
exports.addToBlacklist = addToBlacklist;

// import required modules
var ss = require('sdk/simple-storage');
var data = require('sdk/self').data;
var pageMod = require('sdk/page-mod');
var url = require('sdk/url');
var fileHandler = require('fileHandler');
var utils = require('utils');

// declare variables
var blacklistPageMods = [];
var activated = false;
var previousChar = '';
var currentRegExp = '';
var defaultBlacklists = [[]];
var nBlacklists = 0;

/*
 * Enable the blacklisting 
 */
function enable() {
	if(!ss.storage.removedDefaultBlacklistElements) {
		ss.storage.removedDefaultBlacklistElements = [];
	}
	// open file with default sites and apply callback
	fileHandler.streamFile('blacklist.txt', callback);
}

/**
 * Callback called when reading the blacklist file (one byte at a time)
 * Stores the content of the file in the right simple storage
 * 
 * @param {string} char the current read character
 * @param {integer} end whether the stream if finished or not
 */ 
function callback(char, end) {
	// if not begin or end of line, append the previous character 
	if((previousChar !== '\r' || char !== '\n') && previousChar !== '\n') {
		currentRegExp += previousChar;
	}
	
	// if end of line or end of stream
	if((previousChar === '\r' && char === '\n' || end) && currentRegExp !== '') {
		if(ss.storage.removedDefaultBlacklistElements.indexOf(currentRegExp) === -1) {
			// as page-mods can't contain more than 500000 elements, break array
			if(defaultBlacklists[nBlacklists].length >= 500000) {
				nBlacklists++;
				defaultBlacklists[nBlacklists] = [];
			}
			defaultBlacklists[nBlacklists].push(currentRegExp);
		}
		currentRegExp = '';
	}
	
	previousChar = char;
	
	// init pagemod(s) if end of file
	if(end) {
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
	
	defaultBlacklists.forEach(function(blacklist) {
		blacklistPageMods.push(pageMod.PageMod({
			include: blacklist,
			contentScriptFile: data.url('blacklisted.js'),
			contentScriptWhen: 'start',
		}));
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
 * This function allows a user to add a new site to the blacklist
 */
function addToBlacklist() {
	// TODO : listen for overQuota
	// initialize the local storage
	if(!ss.storage.customBlacklist) {
		ss.storage.customBlacklist = [];
	}
	
	// add wildcard to the url
	var completeURI = url.URL(utils.getActiveURI());
	var host = completeURI.host;
	var wildcardedHost = host.replace(/^(\w+)\.(\w+)/, '*.$2');
	
	// check if host is already in blacklist or not
	if(ss.storage.customBlacklist.indexOf(wildcardedHost) === -1) {
		ss.storage.customBlacklist.push(wildcardedHost);
	} else {
		console.log('Host is already in custom blacklist');
	}
}