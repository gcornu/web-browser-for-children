// module interfaces
exports.init = init;
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
var whitelistPageMod = null;
var activated = false;

/**
 * Init the whitelisting module
 */
function init() {
	// open file with default sites and apply callback
	fileHandler.streamFile('whitelist.txt', callback);
}

/**
 * Callback called when reading the blacklist file
 * Stores the content of the file in the right simple storage
 * 
 * @param {string} fileData
 */ 
function callback(fileData) {
	var whitelist = fileData.split('\r\n');
	// TODO listen for overQuota event
	ss.storage.defaultWhitelist = whitelist;
	ss.storage.customWhitelist = [];
}

/*
 * Enable the blacklisting 
 */
function enable() {
	// concatenate default and user whitelists
	var whitelist = ss.storage.defaultWhitelist.concat(ss.storage.customWhitelist);
	var whitelistString = '';
	for(var i = 0; i < whitelist.length; i++) {
		whitelistString += whitelist[i].replace('.', '\.') + '|';
	}
	whitelistString = whitelistString.substr(0, whitelistString.length - 1);
	console.log(whitelistString);
	var whitelistRegExp = new RegExp('^(https?|ftp):\/\/(?!(' + whitelistString + ')).*');

	// create a page mod to prevent the content of the blacklisted pages from displaying
	whitelistPageMod = pageMod.PageMod({
		include: whitelistRegExp,
		contentScriptFile: data.url('notWhitelisted.js'),
		contentScriptWhen: 'start',
	});
	
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