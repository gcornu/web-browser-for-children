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
	Request({
		url: 'http://ffc.gcornu.com/stats/init',
		onComplete: function (response) {
			ss.storage.statsId = response.json;
		}
	}).get();

	ss.storage.nbUsedTimes = 0;
	ss.storage.averageUseTime = 0;
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
	if(activated) {
		var usedTime = (Date.now() - activated)/(60*1000);
		ss.storage.nbUsedTimes++;
		ss.storage.averageUseTime = ((ss.storage.nbUsedTimes - 1)*ss.storage.averageUseTime + usedTime)/ss.storage.nbUsedTimes;
	}
}

/**
 * Send stats to server
 */
function sendStats() {
	var request = Request({
		url: 'http://ffc.gcornu.com/stats/send',
		content: {
			statsId: ss.storage.statsId,
			useTime: {
				nbUsedTimes: ss.storage.nbUsedTimes,
				averageUseTime: ss.storage.averageUseTime
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
	const {XMLHttpRequest} = require('sdk/net/xhr');
	var url = 'http://ffc.gcornu.com/stats/uninstalled/' + encodeURI(ss.storage.statsId);
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, false);
	xhr.send(null);
}