// This module logs browsing history to a json file

exports.startLogging = startLogging;
exports.stopLogging = stopLogging;
exports.readLog = readLog;

var tabs = require("sdk/tabs");
var fH = require("fileHandler");

function startLogging() {
	tabs.on('ready', historyListener);

}

function stopLogging() {
	tabs.removeListener('ready',historyListener);
}

function readLog() {
}
		
function historyListener(tab) { //register logging event on tab load
	fH.readJSON("history.json", function(data) { //get old history file
		var visit = { "timestamp" : (new Date()).getTime().toString(), "title" : tab.title, "url": tab.url };
		data.history.push(visit); //append the visit to the history array
		fH.writeJSON(data,"history.json"); //overwrite history file with news data
	});
}