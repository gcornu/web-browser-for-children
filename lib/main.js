var widgets = require('sdk/widget');
var self = require('sdk/self');

var blacklisting = require('blacklisting');
var whitelisting = require('whitelisting');

// these requirements should disappear
var ss = require('sdk/simple-storage');

// init several things at first startup of the addon
if(self.loadReason === 'install') {
	blacklisting.init();
	whitelisting.init();
}

var widget = widgets.Widget({
	id: "toggle",
	label: "Toggle list",
	contentURL: "http://www.mozilla.org/favicon.ico",
	onClick: function() {
		//blacklisting.toggle();
		whitelisting.toggle();
	}
});

var widget = widgets.Widget({
	id: "empty-storages",
	label: "Empty storages",
	contentURL: "http://www.mozilla.org/favicon.ico",
	onClick: function() {
		delete ss.storage.defaultBlacklist;
		delete ss.storage.defaultWhitelist;
	}
});

var widget = widgets.Widget({
	id: 'blacklist_add',
	label: 'Add to blacklist',
	width: 90,
	content: 'Add to blacklist',
	onClick: function() {
		blacklisting.addToBlacklist();
	}
});

var widget = widgets.Widget({
	id: 'whitelist_add',
	label: 'Add to whitelist',
	width: 90,
	content: 'Add to whitelist',
	onClick: function() {
		whitelisting.addToWhitelist();
	}
});