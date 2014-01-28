var widgets = require('sdk/widget');
var windowUtils = require('sdk/window/utils');
var tabUtils = require('sdk/tabs/utils');

var blacklisting = require('blacklisting');
var whitelisting = require('whitelisting');

//temp !!
var ss = require('sdk/simple-storage');
var url = require('sdk/url');
var self = require('sdk/self');

var widget = widgets.Widget({
	id: "toggle",
	label: "Toggle list",
	contentURL: "http://www.mozilla.org/favicon.ico",
	onClick: function() {
		//blacklisting.toggle();
		whitelisting.toggle();
		
		//delete ss.storage.blacklist;
		//delete ss.storage.whitelist;
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
		// TODO : listen for overQuota
		if(!ss.storage.blacklist) {
			ss.storage.blacklist = [];
		}
		var completeURI = url.URL(getActiveURI());
		var host = completeURI.host;
		var wildcardedHost = host.replace(/^(\w+)\.(\w+)/, '*.$2');
		if(ss.storage.blacklist.indexOf(wildcardedHost) === -1) {
			ss.storage.blacklist.push(wildcardedHost);
		} else {
			console.log('Host is already in blacklist');
		}
		console.log('blacklist : ' + ss.storage.blacklist);
	}
});

var widget = widgets.Widget({
	id: 'whitelist_add',
	label: 'Add to whitelist',
	width: 90,
	content: 'Add to whitelist',
	onClick: function() {
		// TODO : listen for overQuota
		if(!ss.storage.whitelist) {
			ss.storage.whitelist = [];
		}
		var completeURI = url.URL(getActiveURI());
		var host = completeURI.host;
		if(ss.storage.whitelist.indexOf(host) === -1) {
			ss.storage.whitelist.push(host);
		} else {
			console.log('Host is already in whitelist');
		}
		console.log('whitelist : ' + ss.storage.whitelist);
	}
});

// init several things at first startup of the addon
if(self.loadReason === 'install') {
	blacklisting.init();
	whitelisting.init();
}

function getActiveURI() {
	// retrieve the most recenty used browser window
	var topWindow = windowUtils.getMostRecentBrowserWindow();
	
	// retrieve the active tab of this window
	var activeTab = tabUtils.getActiveTab(topWindow);
	
	// return the URI of this tab
	return tabUtils.getURI(activeTab);
}