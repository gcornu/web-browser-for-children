exports.setPort = setPort;
exports.setLoginCallback = setLoginCallback;
exports.addToLoginLog = addToLoginLog;
exports.getLoginLog = getLoginLog;
exports.startHistoryLogging = startHistoryLogging; // no arguments, turns on logging to history.json
exports.stopHistoryLogging = stopHistoryLogging; // no arguments, turns off logging
exports.getHistoryLog = getHistoryLog; // requires callback function
exports.clearHistoryLog = clearHistoryLog; // clears entire history.json file

var fileHandler = require('fileHandler');
var tabs = require('sdk/tabs');
var ss = require('sdk/simple-storage');
var port = null;
var loginCallback = null;

/**
 * Set port for event emitting
 */
function setPort(portParam) {
	port = portParam;
}

function setLoginCallback(cbParam) {
	loginCallback = cbParam;
}

/**
 * Add a new entry in the login log
 *
 * @param {boolean} whether the login attempt was succesful or not
 */
function addToLoginLog(success) {
	var successString = success ? 'success' : 'fail';
	var date = new Date();
	date = date.toISOString().replace('T', ' ').replace(/\.[0-9]{3}Z/, '');
	fileHandler.writeFile('log_login.txt', date + ' : ' + successString + '\r\n');
}

/**
 * Return the login log
 *
 * @return {array[string]} array of log entries
 */
function getLoginLog() {
	fileHandler.readFile('log_login.txt', getLoginLogCallback);
}

function getLoginLogCallback(data) {
	var events = data.trim().split('\r\n');
	port.emit('login_log_read', events);
	if(loginCallback) {
		loginCallback(events);
	}
}


function startHistoryLogging() {
	tabs.on('ready', historyListener);
	ss.storage.history=[];
}

function stopHistoryLogging() {
	tabs.removeListener('ready',historyListener);
	writeHistoryLogToFile();
}

function getHistoryLog() {
	function callback(data) {port.emit('history_log_read', data.history);}
	if(ss.storage.history){writeHistoryLogToFile();} //if there is some history, write it first
	fileHandler.on("finishedWritingToFile",function(){	fileHandler.readJSON('history.json', callback);});
}
		
function historyListener(tab) { //register logging event on tab load
	var doNotLog = /^resource/;
	if(!doNotLog.test(tab.url)){
	var visit = { 'timestamp': (new Date()).getTime().toString(), 'title': tab.title, 'url': tab.url };
	ss.storage.history.push(visit);}
}

function clearHistoryLog() {
	fileHandler.writeJSON({'history': []}, 'history.json'); 
	// /!\ overwrites entire history.json file. Might be necessary to read first and just flush history array is history.json is used for some other purpose.
}

function writeHistoryLogToFile() {
		fileHandler.readJSON('history.json', function(data) { //get old history file
		ss.storage.history.forEach(function(visit){
		data.history.push(visit); //append the visit to the history array
		});
		fileHandler.writeJSON(data, 'history.json'); //overwrite history file with news data
		ss.storage.history=[]; //clear ss.storage.history
	});
}

ss.on("overQuota", function(){
	writeHistoryLogToFile();
});