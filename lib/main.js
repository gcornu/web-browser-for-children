var widgets = require("sdk/widget");
var tabs = require("sdk/tabs");
var data = require("sdk/self").data;
var password = require("password");

exports.main = main;

function main(){
	
//Check if the password has been set by the user, if not, show prompt
	if(!password.isDefinedPassword()){
		settings_panel.contentURL = data.url("panels/settings-pass.html");
		settings_panel.show();
		settings_panel.port.emit("set_first_password");
	}
};

/**
  * This section initializes the different panels used by the extension
*/
var auth_panel = require("sdk/panel").Panel({
  width: 300,
  height: 200,
  contentURL: data.url("panels/authentification.html"),
  contentScriptFile: [data.url("jquery-2.0.3.js"),data.url("panels/authentification.js")]
});

auth_panel.on("show", function() { //used to trigger some JS code in authentification.js when panel is shown
  auth_panel.port.emit("show");
  });

var choice_panel = require("sdk/panel").Panel({
  width: 380,
  height: 150,
  contentURL: data.url("panels/choice.html"),
  contentScriptFile: [data.url("jquery-2.0.3.js"),data.url("panels/choice.js")]
});

var settings_panel = require("sdk/panel").Panel({
  width: 800,
  height: 450,
  contentURL: data.url("panels/settings.html"),
  contentScriptFile: [data.url("jquery-2.0.3.js"),data.url("panels/settings.js")]
});

/**
  * Set up a button for the user to interact with the extension
*/
var widget = widgets.Widget({
  id: "settings",
  label: "Settings",
  contentURL: data.url("widget-icon.html"),
  onClick: function() {auth_panel.show();}
});

/**
  * Respond to events triggered by user input in the panels
*/
 
auth_panel.port.on("answer", function (text) { //text contains password given by user
  
	if(password.checkPass(text)) { //Proceed and open choice_panel if password ok
	auth_panel.hide();
	choice_panel.show(); }
  
	//If password was wrong, keep auth_panel open, with an error message displayed
	else auth_panel.port.emit("auth_fail");
		//TODO : log attempt
  
});

choice_panel.port.on("settings", function(){ //if the user chooses settings, show him the settings panel
	choice_panel.hide();
	settings_panel.contentURL=data.url("panels/settings.html"); //forces reload of the settings page
	settings_panel.show();
	});
	
choice_panel.port.on("browse",function(){ //if the user chooses to activate the extension...
	console.log("start browsing");
	//TODO: activate child browsing here
	});

settings_panel.port.on("pass",function(){ //if the user clicks on the settings:password tab, put password form in panel content
	settings_panel.contentURL = data.url("panels/settings-pass.html");
	});

settings_panel.port.on("gen",function(){ //if the user clicks on the settings:general tab, put general form in panel content
	settings_panel.contentURL = data.url("panels/settings.html");
	});

settings_panel.port.on("update_pass",function(pwords){
	//this is triggered when the user submits the change password form in the settings
	var result = password.changePass(pwords.oldpass,pwords.newpass);
	settings_panel.port.emit("change_pass_result",result); //
	});