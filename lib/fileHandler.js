// module interfaces
exports.streamFile = streamFile;
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.overwriteFile = overwriteFile;
exports.readJSON = readJSON;
exports.writeJSON = writeJSON;

// import required modules
var self = require('sdk/self');
const {Cc, Cu, Ci, components} = require('chrome');
var { emit, on, once, off } = require("sdk/event/core");
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/NetUtil.jsm');
Cu.import("resource://gre/modules/FileUtils.jsm");
const ResProtocolHandler = Services.io.getProtocolHandler('resource').QueryInterface(Ci.nsIResProtocolHandler);
const ChromeRegistry = Cc['@mozilla.org/chrome/chrome-registry;1'].getService(Ci.nsIChromeRegistry);
const ConverterStream = Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream);
var RC = Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER;

/**
 * Create the right fileStream
 *
 * @see http://stackoverflow.com/questions/19382201/how-to-load-dll-from-sdk-addon-data-folder
 * 
 * @param {mixed} uri
 * @returns {nsIFile}
 */
function resolveToFile(uri) {
	switch (uri.scheme) {
		case 'chrome':
			return resolveToFile(ChromeRegistry.convertChromeURL(uri));
		case 'resource':
			return resolveToFile(Services.io.newURI(ResProtocolHandler.resolveURI(uri), null, null));
		case 'file':
			return uri.QueryInterface(Ci.nsIFileURL).file;
		default:
			throw new Error('Cannot resolve');
	}
}

/**
 * Stream the given file and apply callback on string
 * 
 * @param {string} fileName
 * @param {function} callback
 */
function streamFile(fileName, callback) {
	var file = self.data.url(fileName);
	file = resolveToFile(Services.io.newURI(file, null, null));

	NetUtil.asyncFetch(file, function (inputStream, status) {
		if(!components.isSuccessCode(status)) {
			throw new Error('Cannot stream file');
		}
		
		ConverterStream.init(inputStream, 'UTF-8', 1, 0);
		try {
			var str = {};
			var length = 0;
			do {
				length = ConverterStream.readString(1, str);
				callback(str.value, length === 0);
			} while(length);
		} finally {
			ConverterStream.close();
		}
	});
}

/**
 * Read the given file and apply callback on string
 * 
 * @param {string} fileName
 * @param {function} callback
 */
function readFile(fileName, callback) {
	var file = self.data.url(fileName);
	file = resolveToFile(Services.io.newURI(file, null, null));

	NetUtil.asyncFetch(file, function (inputStream, status) {
		if(!components.isSuccessCode(status)) {
			throw new Error('Cannot read file');
		}
		
		var data;
		try {
			data = NetUtil.readInputStreamToString(inputStream, inputStream.available());
		} catch(e) {
			data = '';
		}
		
		callback(data);
	});
}

/**
 * Append content to a file
 *
 * @param {string} name of the file to write in
 * @param {string} data to write in the file
 */
function writeFile(fileName, data) {
	var file = self.data.url(fileName);
	file = resolveToFile(Services.io.newURI(file, null, null));

	var ostream = FileUtils.openFileOutputStream(file, FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_APPEND)

	var converter = components.classes["@mozilla.org/intl/scriptableunicodeconverter"].
					createInstance(Ci.nsIScriptableUnicodeConverter);
	converter.charset = 'UTF-8';
	var istream = converter.convertToInputStream(data);

	NetUtil.asyncCopy(istream, ostream, function (status) {
		if(!components.isSuccessCode(status)) {
			throw new Error('Cannot read file');
		}
	});
}

/**
 * Overwrite contents of a file
 *
 * @param {string} name of the file to write in
 * @param {string} data to write in the file
 */

function overwriteFile(fileName, data) {
	var file = self.data.url(fileName);
	file = resolveToFile(Services.io.newURI(file, null, null));
	
	var ostream = FileUtils.openFileOutputStream(file, FileUtils.MODE_WRONLY | FileUtils.MODE_CREATE | FileUtils.MODE_TRUNCATE);
	
	var converter = Cc['@mozilla.org/intl/scriptableunicodeconverter'].createInstance(Ci.nsIScriptableUnicodeConverter);
    converter.charset = 'UTF-8';
	
	var istream = converter.convertToInputStream(data);
	NetUtil.asyncCopy(istream, ostream, function (status) {
        if (!components.isSuccessCode(status)) {
            // Handle error!
            Cu.reportError('error on write isSuccessCode = ' + status);
            return;
        }
		emit(exports, "finishedWritingToFile", fileName); //emits an event once writing is a success
        // Data has been written to the file.
	});
}

function readJSON(jsonFileToRead,callback) {
	function parsedCallback (data) {
		return callback(JSON.parse(data));
	}
	readFile(jsonFileToRead, parsedCallback);
}

function writeJSON(jsonData,fileToWriteTo) {
	overwriteFile(fileToWriteTo,JSON.stringify(jsonData));
}

exports.on = on.bind(null, exports);