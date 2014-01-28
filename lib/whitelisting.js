// module interfaces
exports.enable = enable;
exports.disable = disable;
exports.toggle = toggle;

// import required modules
var data = require('sdk/self').data;
var pageMod = require('sdk/page-mod');
var fileHandler = require('fileHandler');

// declare variables
var whitelistPageMod = null;
var activated = false;

/*
 * Enable the blacklisting 
 */
function enable() {
	// open file with default sites and apply callback
	fileHandler.streamFile('whitelist.txt', callback);
}

/**
 * Callback called when reading the blacklist file
 * 
 * @param {string} fileData
 */ 
function callback(fileData) {
	var whitelist = fileData.split('\r\n');
	
	for(var i = 0; i < whitelist.length; i++) {
		whitelist[i] = '/^(https?|ftp):\/\/(?!' + whitelist[i].replace('.', '\.') + '.*/';
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