var widgets = require('sdk/widget');
var self = require('sdk/self');

var blacklisting = require('blacklisting');
var whitelisting = require('whitelisting');

// these requirements should disappear
var ss = require('sdk/simple-storage');

var toggleWidget = widgets.Widget({
	id: "toggle",
	label: "Toggle list",
	contentURL: "http://www.mozilla.org/favicon.ico",
	onClick: function() {
		//ss.storage.removedDefaultBlacklistElements = ['*.wikipedia.org'];
		//blacklisting.toggle();
		ss.storage.removedDefaultWhitelistElements = ['fr.wikipedia.org'];
		whitelisting.toggle();
	}
});

var emptyWidget = widgets.Widget({
	id: "empty-storages",
	label: "Empty storages",
	contentURL: "http://www.mozilla.org/favicon.ico",
	onClick: function() {
		delete ss.storage.customBlacklist;
		delete ss.storage.customWhitelist;
		delete ss.storage.removedDefaultBlacklistElements;
		delete ss.storage.removedDefaultWhitelistElements;
	}
});

var addBlacklistWidget = widgets.Widget({
	id: 'blacklist_add',
	label: 'Add to blacklist',
	width: 90,
	content: 'Add to blacklist',
	onClick: function() {
		blacklisting.addToBlacklist();
	}
});

var addWhitelistWidget = widgets.Widget({
	id: 'whitelist_add',
	label: 'Add to whitelist',
	width: 90,
	content: 'Add to whitelist',
	onClick: function() {
		whitelisting.addToWhitelist();
	}
});