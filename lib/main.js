var widgets = require("sdk/widget");
var tabs = require("sdk/tabs");
var data = require("sdk/self").data;
var password = require("password");

var auth_panel = require("sdk/panel").Panel({
  width: 212,
  height: 200,
  contentURL: data.url("authentification.html"),
  contentScriptFile: [data.url("jquery-2.0.3.js"),data.url("authentification.js")]
});

var widget = widgets.Widget({
  id: "settings",
  label: "Settings",
  contentURL: "http://www.mozilla.org/favicon.ico",
  panel: auth_panel
});


auth_panel.on("show", function() {
  auth_panel.port.emit("show");
  });
 
auth_panel.port.on("answer", function (text) {
  openSettings(text);
  auth_panel.hide();
});

function openSettings(pass) { //Opens settings panel if password is correct
	if(password.checkPass(pass)){ //Proceed if password is correct
		console.log(pass);
	}
	else console.log("le mot de passe est faux"); //if password was wrong show failure window
}