// used for receiving a message from known websites/parties
startNativeProcess();

function startNativeProcess() {
    chrome.runtime.onMessageExternal.addListener(proxyNativeMessage);
}

function proxyNativeMessage(request, sender, extensionMessageResponse) {
    chrome.runtime.sendNativeMessage('aa.browser.shim', request, function(response) {
        if (chrome.runtime.lastError) {
            // if native messaging failed, wrap the response in the same JSON/PROTO as a failed response
            var errorResult = {
                'error': { 'message': chrome.runtime.lastError.message }
            };
            extensionMessageResponse(errorResult);
        } else {
            // proxy the response back to the client
            extensionMessageResponse(response);
        }
    });
    return true;
}

try {
    module.exports = {
        proxyNativeMessage,
        startNativeProcess
    };
} catch (e) { }
