let { before, after } = require('sdk/test/utils');

var blacklisting = require('./blacklisting');
var ss = require('sdk/simple-storage');
var utils = require('utils');

exports['test default blacklist'] = function (assert) {
	var defaultBlacklist, index;
	blacklisting.removeElementsFromDefaultBlacklist(['*.mozilla.org'], 'General');
	defaultBlacklist = blacklisting.getDefaultBlacklist();
	index = defaultBlacklist['General'].indexOf('*.mozilla.org');
	assert.ok(index === -1, 'Remove element from default blacklist');

	blacklisting.addElementsToDefaultBlacklist(['*.mozilla.org'], 'General');
	defaultBlacklist = blacklisting.getDefaultBlacklist();
	index = defaultBlacklist['General'].indexOf('*.mozilla.org');
	assert.ok(index !== -1, 'Add element to default blacklist');
};

exports['test custom blacklist'] = function (assert, done) {
	var index;
	blacklisting.addElementToCustomBlacklist('www.test.com', 'Default');
	index = ss.storage.customBlacklist['Default'].indexOf('*.test.com');
	assert.ok(index !== -1, 'Add element to custom blacklist');
	assert.deepEqual(blacklisting.customBlacklistCategories(), ['Default'], 'Custom blacklist categories')

	blacklisting.removeElementsFromCustomBlacklist(['*.test.com'], 'Default');
	assert.ok(!ss.storage.customBlacklist['Default'], 'Remove element from custom blacklist');

	var tabs = require('sdk/tabs');
	tabs.open({
		url: 'http://www.example.com',
		onReady: function () {
			blacklisting.addActiveURIToBlacklist('Default');
			index = ss.storage.customBlacklist['Default'].indexOf('*.example.com');
			assert.ok(index !== -1, 'Add active URI to custom blacklist');
			done();
		}
	});
}

before(exports, function (name, assert, done) {
	blacklisting.setInitCallback(function () {
    	done();
  	});
  	var portStub = new Object();
	portStub.emit = function () {};
	blacklisting.setPort(portStub);
  	blacklisting.init(true);
});

require('sdk/test').run(exports);