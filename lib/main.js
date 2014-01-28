var widgets = require("sdk/widget");
var tabs = require("sdk/tabs");
var data = require("sdk/self").data;
var password = require("password");

var auth_panel = require("sdk/panel").Panel({
  width: 300,
  height: 200,
  contentURL: data.url("authentification.html"),
  contentScriptFile: [data.url("jquery-2.0.3.js"),data.url("authentification.js")]
});

var widget = widgets.Widget({
  id: "settings",
  label: "Settings",
  contentURL: "http://www.mozilla.org/favicon.ico",
  //panel: auth_panel
  onClick: function() {auth_panel.show();}
});

auth_panel.on("show", function() {
  auth_panel.port.emit("show");
  });
 
auth_panel.port.on("answer", function (text) {
  openSettings(text);
  
  if(password.checkPass(text)) {
	auth_panel.hide();
	choice_panel.show(); }
  //Proceed and open choice_panel if password ok

  else auth_panel.port.emit("auth_fail");
  //If password was wrong, keep auth_panel open, with an error message displayed
  //TODO : log attempt
  
});

function openSettings(pass) { //Opens settings panel if password is correct
	if(password.checkPass(pass)){ //Proceed if password is correct
		console.log(pass);
	}
	else console.log("le mot de passe est faux"); //if password was wrong show failure window
}