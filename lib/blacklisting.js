// module interfaces
exports.init = init;
exports.enable = enable;
exports.disable = disable;
exports.toggle = toggle;
exports.addToBlacklist = addToBlacklist;

// import required modules
var ss = require('sdk/simple-storage');
var data = require('sdk/self').data;
var pageMod = require('sdk/page-mod');
var url = require('sdk/url');
var fileHandler = require('fileHandler');
var utils = require('utils');

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
	ss.storage.customBlacklist = [];
}

/*
 * Enable the blacklisting 
 */
function enable() {
	// concatenate default and user blacklists
	var blacklist = ss.storage.defaultBlacklist.concat(ss.storage.customBlacklist);
	
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
		console.log('Host is already in blacklist');
	}
}