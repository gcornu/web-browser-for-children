// This module logs browsing history to a json file

exports.startLogging = startLogging; // no arguments, turns on logging to history.json
exports.stopLogging = stopLogging; // no arguments, turns off logging
exports.readLog = readLog; // requires callback function
exports.clearLog = clearLog; // clears entire history.json file
exports.setPort = setPort;

var tabs = require("sdk/tabs");
var fH = require("fileHandler");

var port = null;

/**
 * Set port for event emitting
 */
function setPort(portParam) {
	port = portParam;
}


function startLogging() {
	tabs.on('ready', historyListener);

}

function stopLogging() {
	tabs.removeListener('ready',historyListener);
}

function readLog() {
	function callback(data) {port.emit("history_log_read",data.history);}
	fH.readJSON("history.json", callback);
	
}
		
function historyListener(tab) { //register logging event on tab load
	fH.readJSON("history.json", function(data) { //get old history file
		var visit = { "timestamp" : (new Date()).getTime().toString(), "title" : tab.title, "url": tab.url };
		data.history.push(visit); //append the visit to the history array
		fH.writeJSON(data,"history.json"); //overwrite history file with news data
	});
}

function clearLog() {
	fH.writeJSON({"history":[]},"history.json"); 
	// /!\ overwrites entire history.json file. Might be necessary to read first and just flush history array is history.json is used for some other purpose.
}