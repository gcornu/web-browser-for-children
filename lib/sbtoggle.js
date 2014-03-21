/**
  * This module activates safe browsing
*/

exports.activate = activate;
exports.deactivate = deactivate;
exports.isActivated = isActivated;

var ss = require('sdk/simple-storage');
var data = require("sdk/self").data;
var logs = require('logs');
var blacklisting = require('blacklisting');
var whitelisting = require('whitelisting');
var timeLimit = require('timeLimit');
var {Cc, Ci} = require('chrome');
var pageMod = require("sdk/page-mod");
var favorites = require("favorites");
var mediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
var tabs = require("sdk/tabs");
var document = mediator.getMostRecentWindow('navigator:browser').document;
var navbar = document.getElementById('nav-bar');
//the array in which we'll store the deleted elements and their parents, with the following form of objects: {element: --, parent: --}
var removedElements = new Array(),
	opened_tabs = [];
//The ids of all the toolbars (used to set hidden=false when deactivating safe browsing)
var toolbarsIds= new Array();
var fav_worker=null;


function activate() {
	toggle(true);
	logs.startHistoryLogging();
	logs.startTimeLogging();
	timeLimit.enable();
	
	removeAll();


	//setting the first page to homepage
	function tabListener(readyTab) {
		//attaching the script and getting the worker
		fav_worker = readyTab.attach({
			contentScriptFile:[data.url("jquery-2.0.3.js"), data.url('child-homepage.js')]
		});
		
		//calling function from favorites.js which sends favorites to homepage
		favorites.setPort(fav_worker.port);
		fav_worker.port.on('require_favorites', function(){
			favorites.getChildFavorites()
		});
		for each (var tab in tabs) {
			if(tab.url !== data.url('child-homepage.html')) {
				if(!tab.url.startsWith('about:')) {
					opened_tabs.push({
						url: tab.url,
						isPinned: tab.isPinned
					});
				}
				tab.close();
			}
		}
		readyTab.removeListener('ready', tabListener);
	}
	tabs.open({
		url: data.url('child-homepage.html'),
		onReady: tabListener
	});
	
	
	
	pageMod.PageMod({
		include: "*",
		contentScript: 'window.alert("Page matches ruleset");'
	});
	
	
	/*
	*Block trying to change the content of urlbar, but doesn't work :-(
	*/
	/*var urlbar=document.getElementById('urlbar');
	urlbar.value='dfvdlbdf';
	var hbox=urlbar.getElementsByTagName('hbox');
	console.log('flngler : '+hbox.length);
	console.log(hbox[1].value);
	hbox[1].value="hihi";
	*/
}

function isActivated() {
	return ss.storage.isActivated;
}

function deactivate() {
	toggle(false);
	logs.stopHistoryLogging();
	logs.stopTimeLogging();
	timeLimit.disable();
	
	unRemoveAll();

	tabs.open({
		url: 'about:newtab',
		onOpen: function (openedTab) {
			for each (var tab in tabs) {
				if(tab !== openedTab) {
					tab.close();
				}
			}

			opened_tabs.forEach(function (tabProp) {
				tabs.open({
					url: tabProp.url,
					isPinned: tabProp.isPinned
				});
			});

			for each (var tab in tabs) {
				if(tab !== openedTab) {
					tab.close();
				}
			}

			if(tabs.length > 1) {
				openedTab.close();
			}
		}
	});
}


function toggle(boolvalue) {
	var window = require('sdk/window/utils').getMostRecentBrowserWindow();
	var topWindow = window.content;
	topWindow.fullScreen = boolvalue;
	ss.storage.isActivated = boolvalue;
	var url = (boolvalue) ? "logo-on.png" : "logo-off.png";
	(window.document.getElementById("FfC-start")).image = data.url(url);
	
	if(boolvalue) {
		switch(ss.storage.filter) {
			case "wlist":
				whitelisting.enable();
				break;
			case "blist":
				blacklisting.enable();
				break;
		}
	} else {
		whitelisting.disable();
		blacklisting.disable();
	}
}


function removeAll(){
	//removing useless buttons in nav-bar and storing them
	var buttonsToKeepIds= new Array('unified-back-forward-button', 'urlbar-container' , 'home-button', 'reload-button', 'stop-button', 'FfC-start');
	var buttons=navbar.childNodes;
	//getting the IDs of these buttons - seems useless to do so (you get the element, then the id and finally get the id again), but if I don't it doesn't work properly : some unrelevant buttons are kept alive
	var buttonsIds= new Array();
	for(var i=0 ; i<buttons.length ; i++){
		buttonsIds.push(buttons[i].getAttribute('id'));
	}
	for(var i=0 ; i<buttonsIds.length ; i++){
		if( buttonsToKeepIds.indexOf(buttonsIds[i]) ==-1){	
			
			var element=document.getElementById(buttonsIds[i]);
			deleteAndStore(element);
		}
	}
	
	
	//hiding all the useless toolbars
	var toolbars=document.getElementsByTagName('toolbar');
	//list of the ids of the toolbars we want to keep
	var toolbarsToKeepIds=new Array('nav-bar', 'TabsToolbar');
	
	for(var i=0 ; i<toolbars.length ; i++){
		toolbarsIds.push(toolbars[i].getAttribute('id'));
	}
	
	for(var i=0 ; i<toolbarsIds.length ; i++){
		if( toolbarsToKeepIds.indexOf(toolbarsIds[i]) ==-1){
			var element=document.getElementById(toolbarsIds[i]);
			element.hidden=true;
		}
	}
	

	
	
	
	/*
	*Deleting the elements of popupset
	*/
	
	//removing context menu and tab context menu (and storing)
	var menuesToDelete=document.getElementsByTagName('menupopup');
	var menuesToDeleteIds=new Array();
	for(var i=0 ; i<menuesToDelete.length ; i++){
		var element=menuesToDelete[i];
		deleteAndStore(element);
	}
	
	var popupsToDelete=document.getElementsByTagName('popupnotification');
	var popupsToDeleteIds=new Array();
	for(var i=0 ; i<popupsToDelete.length ; i++){
		var element=popupsToDelete[i];
		deleteAndStore(element);			
	}
	
	//Note: Don't delete panels and tooltips, otherwise refresh functionnality doesn't work anymore (idem for creating new tabs)).

	//removing top-left firefox button
	var ffButton = document.getElementById('appmenu-button-container');
	deleteAndStore(ffButton);
	
	
	//deleting the "dangerous" commands : opening a file, saving,...
	var toDelete=new Array('placesCommands' ,"cmd_newNavigator" , "Browser:OpenFile", "Browser:SavePage", "Browser:SendLink",  "Browser:AddBookmarkAs", "Browser:BookmarkAllTabs" ,  "Browser:OpenLocation" ,"Browser:RestoreLastSession" , "Tools:Search" , "Tools:Downloads" , "Tools:BrowserConsole" , "Tools:PrivateBrowsing");
	for(var i=0 ; i<toDelete.length ; i++){
		var element=document.getElementById(toDelete[i]);
		deleteAndStore(element);
	}
	
	//simple function removes an element, and stores a new item in removedElements, including the element, its parent and (if exists) its nextSibling (to replace all with the right order when deactivating)
	function deleteAndStore(element){
		var parent=	element.parentNode;
		var nextSibling;
		if(element.nextSibling){nextSibling=element.nextSibling;}
		parent.removeChild(element);
		removedElements.push({'element':element , 'parent':parent, 'nextSibling':nextSibling });
	}


}

//Going through the removedElements array, and replace the elements. Begins with the end of the array to be able to replace elements in the right order (otherwise, nextSibling is sometimes not yet replaced).
function unRemoveAll(){
	while(removedElements.length){	
		var item=removedElements[removedElements.length - 1];
		if(item.nextSibling && item.nextSibling.parentNode){//if the next sibling exists and is already in the xul tree
			item.parent.insertBefore(item.element, item.nextSibling);
		}
		
		else{
			item.parent.appendChild(item.element);
		}
		removedElements.pop();
	}
	
	for(var i=0 ; i<toolbarsIds.length ; i++){
			if(toolbarsIds[i] != 'developer-toolbar'){
				var element=document.getElementById(toolbarsIds[i]);
				element.hidden=false;
			}
	}
}