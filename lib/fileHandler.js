// module interfaces
exports.streamFile = streamFile;

// import required modules
var self = require('sdk/self');
const {Cc, Cu, Ci, components} = require('chrome');
Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/NetUtil.jsm');
const ResProtocolHandler = Services.io.getProtocolHandler('resource').QueryInterface(Ci.nsIResProtocolHandler);
const ChromeRegistry = Cc['@mozilla.org/chrome/chrome-registry;1'].getService(Ci.nsIChromeRegistry);
const ConverterStream = Cc['@mozilla.org/intl/converter-input-stream;1'].createInstance(Ci.nsIConverterInputStream);
var RC = Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER;

/**
 * Create the right fileStream
 * This function is taken from http://stackoverflow.com/questions/19382201/how-to-load-dll-from-sdk-addon-data-folder
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
 * Read the given file and apply callback on string
 * 
 * @param {string} fileName
 * @param {function} callback
 */
function streamFile(fileName, callback) {
	var file = self.data.url(fileName);
	file = resolveToFile(Services.io.newURI(file, null, null));

	NetUtil.asyncFetch(file, function(inputStream, status) {
		if(!components.isSuccessCode(status)) {
			throw new Error('Cannot read file');
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