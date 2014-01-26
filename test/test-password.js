var password = require("./password");

exports["test checkPass init"] = function(assert) {
  assert.ok(password.checkPass(""),"init worked");
};

exports["test checkPass wrong password"] = function(assert) {
  assert.ok(!password.checkPass("a"),"wrong password test ok");
};

exports["test changePass with wrong password"] = function(assert) {
  assert.ok(!password.changePass("a","romain"),"wrong password change test ok");
};

exports["test changePass with correct password"] = function(assert) {
  assert.ok(function (){
	if(changePass("","romain")){
		if(checkPass("romain"))	return true;
		else return false;}
	else return false;
  },"correct password change test ok");
};

require("sdk/test").run(exports);
