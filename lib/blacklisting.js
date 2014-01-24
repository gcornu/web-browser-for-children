// module interfaces
exports.init = init;
exports.destroy = destroy;
exports.toggle = toggle;

// import required modules
var pageMod = require('sdk/page-mod');
var fileHandler = require('fileHandler');

// declare variables
var blacklistPageMod;
var activated = false;

/*
 * Init the blacklisting 
 */
function init() {
	// open file with default sites and apply callback
	fileHandler.streamFile('blacklist.txt', callback);
}

/**
 * Callback called when reading the blacklist file
 * 
 * @param {string} data
 */ 
function callback(data) {
	var blacklist = data.split('\r\n');
	
	// create a page mod to prevent the content of the blacklisted pages from displaying
	blacklistPageMod = pageMod.PageMod({
		include: blacklist,
		contentScript: 'document.body.innerHTML = ' +
					   ' "<h1>This page is blacklisted. Go away!</h1>";' + 
					   'document.body.style.display = "block";',
		contentStyle: 'body { display: none; }',
	});
	
	activated = true;
}

/**
 * Destroy the blacklisting
 */
function destroy() {
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
		// if not activated, activate
		init();
	} else {
		// else destroy
		destroy();
	}
}