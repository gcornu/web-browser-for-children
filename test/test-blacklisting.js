let { before, after } = require('sdk/test/utils');

var blacklisting = require('./blacklisting');
var timers = require('sdk/timers');

exports['test remove default blacklist'] = function (assert) {
	blacklisting.removeElementsFromDefaultBlacklist(['*.mozilla.org'], 'General');
	var defaultBlacklist = blacklisting.getDefaultBlacklist();
	var index = defaultBlacklist['General'].indexOf('*.mozilla.org');
	assert.ok(index === -1, 'Remove element from default blacklist ok');
};

before(exports, function (name, assert, done) {
	blacklisting.setInitCallback(function () {
    	done();
  	});
  	blacklisting.init(true);
});

require('sdk/test').run(exports);