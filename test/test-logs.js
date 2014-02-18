var logs = require("./logs");

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

require("sdk/test").run(exports);