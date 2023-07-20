// contentScriptActivated flag is needed in order to ensure the content scripts are only ever loaded once
let contentScriptActivated = false;
function activateContentScript() {
    /*
        Put all behavior-modifying listeners and operations here.
        It will be called as soon as the content script loads if the extension is not disabled.
    */

    // EVENTS
    chrome.runtime.onMessage.addListener(extensionOnMessageListener);

    window.addEventListener('message', handleMessage, false);

    window.addEventListener("automationanywhere-recorder-alert", function (event) {
        chrome.runtime.sendMessage({ type: "AlertOpen" }, function (response) { isAlertWindowOpen = true; checkChromeError(); });
    });

    window.addEventListener("automationanywhere-recorder-alert-closed", function (event) {
        chrome.runtime.sendMessage({ type: "AlertClose" }, function (response) { isAlertWindowOpen = false; checkChromeError(); });
    });

    document.addEventListener("securitypolicyviolation", function (e) {
        // TODO: can this check the details? a securitypolicyviolation could be triggered by the page itself
        securityPolicyViolationState = true;
        securityPolicyEventData = e;
    });

    window.addEventListener("automationanywhere-recorder-securitypolicychecker", function (event) {
        securityPolicyViolationState = false;
    });

    window.addEventListener('_AAEventForPageFramework', pageFrameworkEventListener);
    addTriggerListener();

    injectJavascript();

    // TODO: should these be fired when load completes, instead of immediately?
    chrome.runtime.sendMessage({ type: "GET_MAPPER_DICTIONARY" }, function (response) {
        checkChromeError();
        if (response) {
            InitializeObjectMapper(response.mapperXML);
        }
    });

    chrome.runtime.sendMessage({ type: "CSP_CHECK" }, () => checkChromeError());
    chrome.runtime.sendMessage({ type: "SET_FRAME_INDEX" }, () => checkChromeError());
    chrome.runtime.sendMessage({ type: "DETECT_FRAMEWORK" }, () => checkChromeError());
}

chrome.storage.sync.get(
    {
        "disableNativeMessaging": false,
    },
    function (storedResult) {
        AALogger.log("script", "content script load: disabled =", storedResult.disableNativeMessaging);
        if (!storedResult.disableNativeMessaging && !contentScriptActivated) {
            activateContentScript();
            contentScriptActivated = true;
        }
    }
);
