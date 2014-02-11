exports.setPort = setPort;
exports.addToLoginLog = addToLoginLog;
exports.getLoginLog = getLoginLog;

var fileHandler = require('fileHandler');

var port = null;

/**
 * Set port for event emitting
 */
function setPort(portParam) {
	port = portParam;
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
	var events = data.split('\r\n');
	port.emit('login_log_read', events);
}