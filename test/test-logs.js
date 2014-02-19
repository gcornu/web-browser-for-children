var logs = require("./logs");
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
	// turn on history logging
	logs.startHistoryLogging();
	
	//navigate to a website
	var tabs = require('sdk/tabs');
	var pageToVisit="http://example.com";
	tabs.open({
		url: pageToVisit,
		onClose: callback
	});
	function callback() {
		require("sdk/timers").setTimeout(verifyLog(pageToVisit),5000);
	}
	function verifyLog(url) {
		//strip url of http prefix, www and trailing slash, as browser may or may not automatically add them
		function removeUrlPrefix(url) {
			prefix = /(^https?:\/\/|www\.|\/$)/g;
			// remove any prefix
			url = url.replace(prefix, "");
			//url = url.replace(/www\/./, "");
			return url;
		}
	//check that the website has been logged
		var fileHandler = require('./fileHandler');
		//fileHandler.writeJSON({history:[url]},'history.json');
		fileHandler.readJSON('history.json', function(data) {
			console.log("history url: "+(_.last(data.history)).url);
			assert.ok(_.isEqual(removeUrlPrefix((_.last(data.history)).url),removeUrlPrefix(url)),"log visited website success");
			done();
		});
	}
	

	
	//turn off history logging
	logs.stopHistoryLogging();
	
	//navigate to a website
	
	//chack that website has not been logged
	
	//clear history log
	
};

require("sdk/test").run(exports);