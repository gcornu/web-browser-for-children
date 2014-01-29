var widgets = require("sdk/widget");
var data = require("sdk/self").data;
var password = require("password");

exports.main = main;

function main(){	
	//Check if the password has been set by the user, if not, show prompt
	if(!password.isDefinedPassword()){
		parentUI.settings.contentURL = data.url("panels/settings-pass.html");
		parentUI.settings.show();
		parentUI.settings.port.emit("set_first_password");
	}
};

/**
  * This section initializes the different panels used by the extension
*/
parentUI=function(){ //set up all the necessary panels in a "parentUI" object
	var auth_panel= require("sdk/panel").Panel({ //auth_panel is used to ask the user for his password before proceeding
	  width: 300,
	  height: 200,
	  contentURL: data.url("panels/authentification.html"),
	  contentScriptFile: [data.url("jquery-2.0.3.js"),data.url("panels/authentification.js")]
	});

	var choice_panel = require("sdk/panel").Panel({ //choice_panel asks the user what he wants to do
	  width: 380,
	  height: 150,
	  contentURL: data.url("panels/choice.html"),
	  contentScriptFile: [data.url("jquery-2.0.3.js"),data.url("panels/choice.js")]
	});

	var settings_panel = require("sdk/panel").Panel({ //setings_panel lets the user configure options for the extension
	  width: 800,
	  height: 450,
	  contentURL: data.url("panels/settings.html"),
	  contentScriptFile: [data.url("jquery-2.0.3.js"),data.url("panels/settings.js")]
	});
	
	return{auth:auth_panel,choice:choice_panel,settings:settings_panel}
}();

/**
  * Set up a button for the user to interact with the extension
*/
var widget = widgets.Widget({
  id: "settings",
  label: "Settings",
  contentURL: data.url("widget-icon.html"),
  onClick: function() {parentUI.auth.show();}
});

/**
  * Respond to events triggered by user input in the panels
*/
parentUI.auth.on("show", function() { //used to trigger some JS code in authentification.js when panel is shown
  parentUI.auth.port.emit("show");
  });
  
parentUI.auth.port.on("answer", function (text) { //text contains password given by user
  
	if(password.checkPass(text)) { //Proceed and open choice_panel if password ok
	parentUI.auth.hide();
	parentUI.choice.show(); }
  
	//If password was wrong, keep auth_panel open, with an error message displayed
	else parentUI.auth.port.emit("auth_fail");
		//TODO : log attempt
  
});

parentUI.choice.port.on("settings", function(){ //if the user chooses settings, show him the settings panel
	parentUI.choice.hide();
	parentUI.settings.contentURL=data.url("panels/settings.html"); //forces reload of the settings page
	parentUI.settings.show();
	});
	
parentUI.choice.port.on("browse",function(){ //if the user chooses to activate the extension...
	console.log("start browsing");
	//TODO: activate child browsing here
	});

parentUI.settings.port.on("pass",function(){ //if the user clicks on the settings:password tab, put password form in panel content
	parentUI.settings.contentURL = data.url("panels/settings-pass.html");
	});

parentUI.settings.port.on("gen",function(){ //if the user clicks on the settings:general tab, put general form in panel content
	parentUI.settings.contentURL = data.url("panels/settings.html");
	});

parentUI.settings.port.on("update_pass",function(pwords){
	//this is triggered when the user submits the change password form in the settings
	var result = password.changePass(pwords.oldpass,pwords.newpass);
	parentUI.settings.port.emit("change_pass_result",result); //
	});