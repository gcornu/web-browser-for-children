exports.ffc_enabled = ffcEnabled;
exports.ffc-disabled = ffcDisabled;
exports.send_stats = sendStats;

var ss = require('sdk/simple-storage');
var timers = require('sdk/timers');

var activations = [];

/**
 * Log extension enabling
 */
function ffcEnabled() {
	ffc_enabling_log('disabled');
}

/**
 * Log extension disabling
 */
function ffcDisabled() {
	ffc_enabling_log('disabled');
}

/**
 * Helper for enabling log
 */
function ffcEnablingLog(type) {
	var date = new Date();
	var timestamp = formatDate(date);
	activations.push({
		timestamp: 'ffc ' + type;
	});
}

/**
 * Helper for formatting dates objects into human readable strings
 */
function formatDate(date) {
	return date.getUTCFullYear() + '-' + date.getUTCMonth() + '-' + date.getUTCDate() + ' ' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCSeconds();
}

/**
 * Send stats to server
 */
function sendStats() {
	
}