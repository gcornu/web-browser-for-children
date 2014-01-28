// module interfaces
exports.init = init;
exports.enable = enable;
exports.disable = disable;
exports.toggle = toggle;

// import required modules
var ss = require('sdk/simple-storage');
var data = require('sdk/self').data;
var pageMod = require('sdk/page-mod');
var fileHandler = require('fileHandler');

// declare variables
var blacklistPageMod = null;
var activated = false;

/**
 * Init the blacklisting module
 */
function init() {
	// open file with default sites and apply callback
	fileHandler.streamFile('blacklist.txt', callback);
}

/**
 * Callback called when reading the blacklist file
 * Stores the content of the file in the right simple storage
 * 
 * @param {string} fileData
 */ 
function callback(fileData) {
	var blacklist = fileData.split('\r\n');
	// TODO listen for overQuota event
	ss.storage.defaultBlacklist = blacklist;
}

/*
 * Enable the blacklisting 
 */
function enable() {
	// create a page mod to prevent the content of the blacklisted pages from displaying
	blacklistPageMod = pageMod.PageMod({
		include: ss.storage.defaultBlacklist,
		contentScriptFile: data.url('blacklisted.js'),
		contentScriptWhen: 'start',
	});
	
	activated = true;
}

/**
 * Disable the blacklisting
 */
function disable() {
	// destroy the page-mod
	blacklistPageMod.destroy();
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