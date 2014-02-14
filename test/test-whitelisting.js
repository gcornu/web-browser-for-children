let { before, after } = require('sdk/test/utils');

var whitelisting = require('./whitelisting');
var ss = require('sdk/simple-storage');
var utils = require('utils');

exports['test default whitelist'] = function (assert) {
	var defaultWhitelist, index;
	whitelisting.removeElementsFromDefaultWhitelist(['www.mozilla.org'], 'General');
	defaultWhitelist = whitelisting.getDefaultWhitelist();
	index = defaultWhitelist['General'].indexOf('www.mozilla.org');
	assert.ok(index === -1, 'Remove element from default whitelist');

	whitelisting.addElementsToDefaultWhitelist(['www.mozilla.org'], 'General');
	defaultWhitelist = whitelisting.getDefaultWhitelist();
	index = defaultWhitelist['General'].indexOf('www.mozilla.org');
	assert.ok(index !== -1, 'Add element to default whitelist');
};

exports['test default whitelist errors'] = function (assert) {
	assert.throws(function () {
			whitelisting.addElementsToDefaultWhitelist(['www.mozilla.org'], 'General');
		},
		/Host is not removed from default whitelist/,
		'Add unremoved element to default whitelist error'
	);
	whitelisting.removeElementsFromDefaultWhitelist(['www.mozilla.org'], 'General');
	assert.throws(function () {
			whitelisting.removeElementsFromDefaultWhitelist(['www.mozilla.org'], 'General');
		},
		/Host is already removed from default whitelist/,
		'Remove already removed element from default whitelist error'
	);
}

exports['test custom whitelist'] = function (assert, done) {
	var index;
	whitelisting.addElementToCustomWhitelist('www.test.com', 'Default');
	console.log(ss.storage.customWhitelist);
	index = ss.storage.customWhitelist['Default'].indexOf('www.test.com');
	assert.ok(index !== -1, 'Add element to custom whitelist');
	assert.deepEqual(whitelisting.customWhitelistCategories(), ['Default'], 'Custom whitelist categories')

	whitelisting.removeElementsFromCustomWhitelist(['www.test.com'], 'Default');
	assert.ok(!ss.storage.customWhitelist['Default'], 'Remove element from custom whitelist');

	var tabs = require('sdk/tabs');
	tabs.open({
		url: 'http://www.example.com',
		onReady: function () {
			whitelisting.addActiveURIToWhitelist('Default');
			index = ss.storage.customWhitelist['Default'].indexOf('www.example.com');
			assert.ok(index !== -1, 'Add active URI to custom whitelist');
			done();
		}
	});
}

exports['test custom whitelist errors'] = function (assert) {
	whitelisting.addElementToCustomWhitelist('www.test.com', 'Default');
	assert.throws(function () {
			whitelisting.removeElementsFromCustomWhitelist(['www.anothertest.com'], 'Default');
		},
		/Host is not in the custom whitelist/,
		'Remove element not in the custom whitelist error'
	);
	whitelisting.removeElementsFromCustomWhitelist(['www.test.com'], 'Default');
	assert.throws(function () {
			whitelisting.removeElementsFromCustomWhitelist(['www.anothertest.com'], 'Default');
		},
		/The given category contains nothing/,
		'Remove element from empty category of custom whitelist error'
	);
	whitelisting.addElementToCustomWhitelist('www.test.com', 'Default');
	assert.throws(function () {
			whitelisting.addElementToCustomWhitelist('www.test.com', 'Default');
		},
		/Host is already in custom whitelist/,
		'Add already added element to the custom whitelist error'
	);
}

before(exports, function (name, assert, done) {
	whitelisting.setInitCallback(function () {
    	done();
  	});
  	var portStub = new Object();
	portStub.emit = function () {};
	whitelisting.setPort(portStub);
  	whitelisting.init(true);
});

after(exports, function (name, assert, done) {
	delete ss.storage.customWhitelist;
	done();
});

require('sdk/test').run(exports);