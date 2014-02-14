var logs = require("./logs");

exports["test auhentication log"] = function(assert, done) {
	var portStub = new Object();
	portStub.emit = function () {};
	logs.setPort(portStub);
	logs.setLoginCallback(function (events) {
		assert.ok(events.length === 2 && events[0].indexOf('success') && events[0].indexOf('fail'), 'Success login test');
		done();
	});
	logs.addToLoginLog(true);
	logs.addToLoginLog(false);
	logs.getLoginLog();
};

require("sdk/test").run(exports);