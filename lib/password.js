/*
Module for extension password management
*/

exports.checkPass = checkPass;
exports.changePass = changePass;
exports.isDefinedPassword = isDefinedPassword;
exports.reinitializePass = reinitializePass;
exports.setPrivateQuestion = setPrivateQuestion;
exports.getPrivateQuestion = getPrivateQuestion;
exports.checkPrivateAnswer = checkPrivateAnswer;

var ss = require("sdk/simple-storage"); //using simple-storage instead of simple-prefs for password storage for now.

//import SHA3 hash algorithm. Has getHash(string-to-hash) and generateSalt() functions
var crypto = require("sha3"); 

function init(){
//initialize salt and password if not already set : this should only happen on installation
	if(!ss.storage.salt) {
		ss.storage.salt=crypto.generateSalt();
	}
	if(!ss.storage.pass) {
		setPass(""); //by default password is empty
	}
}

function isDefinedPassword(){
	init();
	if(ss.storage.pass!==saltAndHash("")&&ss.storage.pass) return true;
	else return false;
}

function saltAndHash(password){
//salts and hashes given password
	return crypto.getHash((ss.storage.salt)+password);
}

function setPass(password){
//salts, hashes and stores given password
	ss.storage.pass=saltAndHash(password);
}

function checkPass(password){
//verifies given password against stored password
	
	var inputHash = saltAndHash(password);
	var storedHash = ss.storage.pass;
	if(inputHash==storedHash){return true;}
	else return false;
}

function changePass(oldPass, newPass){
//changes password from old pass to new pass.
	if(checkPass(oldPass)) { //must first check if oldPass is correct
		setPass(newPass);
		return true;}
	else return false;
}

/**
 * Reinitialize password when recovering it
 */
function reinitializePass() {
	setPass('');
}

// Private question management
function setPrivateQuestion(question, answer) {
	ss.storage.privateQuestion = question;
	ss.storage.privateAnswer = saltAndHash(answer);
}

function getPrivateQuestion() {
	return ss.storage.privateQuestion;
}

function checkPrivateAnswer(answer) {
	if(ss.storage.privateAnswer == saltAndHash(answer)) {
		return true;
	} else {
		return false;
	}
}