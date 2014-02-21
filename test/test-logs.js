var logs = require("./logs");
var fileHandler = require('./fileHandler');
var _ = require("./underscore");


exports["test auhentication log"] = function(assert, done) {
	var portStub = new Object();
	portStub.emit = function () {};
	logs.setPort(portStub);
	logs.setLoginCallback(function (events) {
		assert.ok(events.length === 2, 'Login log file length');
		assert.ok(events[0].indexOf('success') !== -1, 'Success login');
		assert.ok(events[1].indexOf('fail') !== -1, 'Fail login');
		done();
	});
	logs.addToLoginLog(true);
	logs.addToLoginLog(false);
	logs.getLoginLog();
};


exports["test history log"] = function(assert,done) { //for now, requires tester to close tab to validate. Change behavior?
	var tabs = require('sdk/tabs');
	var pageToVisit = "http://example.com";
	var url, prefix;

	function removeUrlPrefix(url) {
		prefix = /(^https?:\/\/|www\.|\/$)/g;
		// remove any prefix
		url = url.replace(prefix, "");
		//url = url.replace(/www\/./, "");
		return url;
	}

	logs.setHistoryCallback(function () {
		//fileHandler.writeJSON({history:[url]},'history.json');
		fileHandler.readJSON('history.json', function(data) {
			console.log("history url: "+(_.last(data.history)).url);
			assert.ok(_.isEqual(removeUrlPrefix((_.last(data.history)).url),removeUrlPrefix(pageToVisit)),"log visited website success");
			done();
		});
	});

	// turn on history logging
	logs.startHistoryLogging();
	
	//navigate to a website
	
	tabs.open({
		url: pageToVisit,
		onReady: logs.historyListener,
		//onClose: callback
	});

	//turn off history logging
	logs.stopHistoryLogging();
	
	//navigate to a website
	
	//chack that website has not been logged
	
	//clear history log
	
};

require("sdk/test").run(exports);