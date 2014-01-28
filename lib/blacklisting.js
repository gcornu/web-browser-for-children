// module interfaces
exports.enable = enable;
exports.disable = disable;
exports.toggle = toggle;

// import required modules
var data = require('sdk/self').data;
var pageMod = require('sdk/page-mod');
var fileHandler = require('fileHandler');

// declare variables
var blacklistPageMod = null;
var activated = false;

/*
 * Enable the blacklisting 
 */
function enable() {
	// open file with default sites and apply callback
	fileHandler.streamFile('blacklist.txt', callback);
}

/**
 * Callback called when reading the blacklist file
 * 
 * @param {string} fileData
 */ 
function callback(fileData) {
	var blacklist = fileData.split('\r\n');
	
	// create a page mod to prevent the content of the blacklisted pages from displaying
	blacklistPageMod = pageMod.PageMod({
		include: blacklist,
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