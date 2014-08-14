exports.ffc_enabled = ffcEnabled;
exports.ffc_disabled = ffcDisabled;
exports.send_stats = sendStats;
exports.init = init;
exports.extensionUninstalled = extensionUninstalled;

var ss = require('sdk/simple-storage');
var timers = require('sdk/timers');
var Request = require('sdk/request').Request;

var activated;

/**
 * Init stats module at extension installation
 */
function init() {
	var request = Request({
		url: 'http://localhost:5000/stats/init',
		onComplete: function (response) {
			console.log('received id: ' + response.json);
			ss.storage.statsId = response.json;
		}
	});
	request.get();

	ss.storage.nbUsedTimes = 0;
	ss.storage.averageUsedTime = 0;
}

/**
 * Log extension enabling
 */
function ffcEnabled() {
	activated = Date.now();
}

/**
 * Log extension disabling
 */
function ffcDisabled() {
	var usedTime = (Date.now() - activated)/(60*1000);
	ss.storage.nbUsedTimes++;
	ss.storage.averageUsedTime = ((ss.storage.nbUsedTimes - 1)*ss.storage.averageUsedTime + usedTime)/ss.storage.nbUsedTimes;
}

/**
 * Send stats to server
 */
function sendStats() {
	var request = Request({
		url: 'http://localhost:5000/stats/send',
		content: {
			statsId: ss.storage.statsId,
			useTime: {
				nbUsedTimes: ss.storage.nbUsedTimes,
				averageUsedTime: ss.storage.averageUsedTime
			},
			preferences: {
				filtering: ss.storage.filter
			}
		},
		onComplete: function (response) {
			console.log('stats sent (response: ' + response.json + ')');
		}
	});
	request.post();
}

/**
 * Send uninstallation signal to stats server
 */
function extensionUninstalled() {
var request = Request({
		url: 'http://ffc.gcornu.com/stats/uninstalled/' + ss.storage.statsId,
		onComplete: function (response) {
			console.log('uninstalled stats signal sent');
		}
	});
	request.get();
}