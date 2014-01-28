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
}

/*
 * Enable the blacklisting 
 */
function enable() {
	var defaultWhitelist = ss.storage.defaultWhitelist;
	var whitelist = [];
	for(var i = 0; i < defaultWhitelist.length; i++) {
		whitelist[i] = new RegExp('^(https?|ftp):\/\/(?!' + defaultWhitelist[i].replace('.', '\.') + ').*');
	}

	// create a page mod to prevent the content of the blacklisted pages from displaying
	whitelistPageMod = pageMod.PageMod({
		include: whitelist,
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