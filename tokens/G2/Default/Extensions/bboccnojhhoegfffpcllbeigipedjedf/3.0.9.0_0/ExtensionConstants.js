// TODO: More constants to come
var chromeUrltobeIgnored = 'chrome://';
var edgeUrltobeIgnored = 'edge://';
var chromeExtensionUrl = 'chrome-extension://';
var supportedChromeVersion = 91;
try {
    module.exports = {
        chromeUrltobeIgnored,
        edgeUrltobeIgnored,
        chromeExtensionUrl
    };
} catch (e) { };
