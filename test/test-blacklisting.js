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

exports['test default blacklist errors'] = function (assert) {
	assert.throws(function () {
			blacklisting.addElementsToDefaultBlacklist(['*.mozilla.org'], 'General');
		},
		/Host is not removed from default blacklist/,
		'Add unremoved element to default blacklist error'
	);
	blacklisting.removeElementsFromDefaultBlacklist(['*.mozilla.org'], 'General');
	assert.throws(function () {
			blacklisting.removeElementsFromDefaultBlacklist(['*.mozilla.org'], 'General');
		},
		/Host is already removed from default blacklist/,
		'Remove already removed element from default blacklist error'
	);
}

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

exports['test custom blacklist errors'] = function (assert) {
	blacklisting.addElementToCustomBlacklist('www.test.com', 'Default');
	assert.throws(function () {
			blacklisting.removeElementsFromCustomBlacklist(['*.anothertest.com'], 'Default');
		},
		/Host is not in the custom blacklist/,
		'Remove element not in the custom blacklist error'
	);
	blacklisting.removeElementsFromCustomBlacklist(['*.test.com'], 'Default');
	assert.throws(function () {
			blacklisting.removeElementsFromCustomBlacklist(['*.anothertest.com'], 'Default');
		},
		/The given category contains nothing/,
		'Remove element from empty category of custom blacklist error'
	);
	blacklisting.addElementToCustomBlacklist('www.test.com', 'Default');
	assert.throws(function () {
			blacklisting.addElementToCustomBlacklist('www.test.com', 'Default');
		},
		/Host is already in custom blacklist/,
		'Add already added element to the custom blacklist error'
	);
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

after(exports, function (name, assert, done) {
	delete ss.storage.customBlacklist;
	done();
});

require('sdk/test').run(exports);