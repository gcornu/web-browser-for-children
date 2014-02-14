var logs = require("./logs");

exports["test auhentication log"] = function(assert, done) {
	var portStub = new Object();
	portStub.emit = function () {};
	logs.setPort(portStub);
	logs.setLoginCallback(function (events) {
		assert.ok(events.length === 1 && events[0].indexOf('success'), 'Success login test');
		done();
	});
	logs.addToLoginLog(true);
	logs.getLoginLog();
};

require("sdk/test").run(exports);