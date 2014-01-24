// module interfaces
exports.init = init;
exports.destroy = destroy;
exports.toggle = toggle;

// import required modules
var data = require('sdk/self').data;
var pageMod = require('sdk/page-mod');
var fileHandler = require('fileHandler');

// declare variables
var whitelistPageMod;
var activated = false;

/*
 * Init the blacklisting 
 */
function init() {
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
		include: /^(https?|ftp):\/\/(?!www\.mozilla\.org).*/,
		contentScriptFile: data.url('notWhitelisted.js'),
		contentScriptWhen: 'start',
	});
	
	activated = true;
}

/**
 * Destroy the blacklisting
 */
function destroy() {
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
		// if not activated, activate
		init();
	} else {
		// else destroy
		destroy();
	}
}