// module interfaces
exports.enable = enable;
exports.disable = disable;
exports.toggle = toggle;
exports.addToWhitelist = addToWhitelist;

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
var previousChar = '';
var currentHost = '';
var defaultWhitelistString = '';
var defaultWhitelistRegExp = '';

/*
 * Enable the whitelisting 
 */
function enable() {
	if(!ss.storage.removedDefaultWhitelistElements) {
		ss.storage.removedDefaultWhitelistElements = [];
	}
	// open file with default sites and apply callback
	fileHandler.streamFile('whitelist.txt', callback);
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
		defaultWhitelistRegExp = new RegExp('^(https?|ftp):\/\/(?!(' + defaultWhitelistString + ')).*');
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
	whitelistPageMod.destroy();
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
 * This function allows a user to add a new site to the whitelist
 */
function addToWhitelist() {
	// TODO : listen for overQuota
	// initialize the local storage
	if(!ss.storage.customWhitelist) {
		ss.storage.customWhitelist = [];
	}
	
	var completeURI = url.URL(utils.getActiveURI());
	var host = completeURI.host;
	
	// check if host is already in whitelist or not
	if(ss.storage.customWhitelist.indexOf(host) === -1) {
		ss.storage.customWhitelist.push(host);
	} else {
		console.log('Host is already in whitelist');
	}
}