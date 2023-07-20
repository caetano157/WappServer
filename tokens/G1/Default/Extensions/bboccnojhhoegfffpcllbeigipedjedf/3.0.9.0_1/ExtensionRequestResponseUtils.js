
function getAllTabsResponse(tabs) {
    var browserResponse = {
        tabListResponse: {
            tabs: tabs
        }
    };

    return browserResponse;
}

function getErrorResponse(message) {
    var browserResponse = {
        errorResponse: {
            errorMessage: message
        }
    };

    return browserResponse;
}

function getOpenURLResponse(tab) {
    var createdTab = createBrowserTabObject(tab);
    var browserResponse = {
        openUrlResponse: {
            tab: createdTab
        }
    };

    return browserResponse;
}

function getNavigateStepResponse() {
    var browserResponse = {
        navigateStepResponse: { }
    };

    return browserResponse;
}

function createBrowserTabObject(tab) {
    var tabDetail = {
        name: tab.title,
        url: tab.url,
        tabId: tab.id.toString(),
        windowId: tab.windowId.toString(),
        isTabActive: tab.active
    };

    return tabDetail;
}

function getTabResponse(tab) {
    var createdTab = createBrowserTabObject(tab);
    var browserResponse = {
        findTabResponse: {
            tab: createdTab
        }
    };

    return browserResponse;
}

function getPageLoadResponse(result, pageStatus) {
    return { documentStatusResponse: { result: result, documentCurrentState: pageStatus.toUpperCase() } };
}

function getCloseTabResponse() {
    var browserResponse = {
        closeTabResponse: { }
    };
    return browserResponse;
}

function resetExecutionRetryFields(context) {
    context.extractSource.isIFrameExtractSourceRequest = false;
    context.extractSource.retryXpath = undefined;
    context.extractSource.retryTabId = undefined;
    context.extractSource.retries = 0;
    context.extractSource.frameIndexResponse = undefined;
    context.extractSource.frameIndexFound = false;
    context.extractSource.retrySelectionCriteria = undefined;
}

function sendFinalExtractSourceResponse(context, response) {
    if (chrome.runtime.lastError) {
        context.sendResponse(getErrorResponse(chrome.runtime.lastError.message));
    } else if (response) {
        if (response.errorResult) {
            context.sendResponse(getErrorResponse(response.errorResult));
        } else {
            context.sendResponse({ extractSourceResponse: { sourceContent: response.result } });
        }
    }
}

function isBasicRequestExtractSource(request) {
    if (request.extractSource && request.extractSource.browserTab &&
        request.extractSource.browserTab.browserControl &&
        request.extractSource.browserTab.browserControl.uiobjectControlType) {
        if (request.extractSource.browserTab.browserControl.uiobjectControlType) {
            return false;
        }
    }
    return true;
}

function isMainframeRequestExtractSource(browserRequest) {
    if (browserRequest.extractSource && browserRequest.extractSource.browserTab &&
        browserRequest.extractSource.browserTab.browserControl &&
        browserRequest.extractSource.browserTab.browserControl.uiobjectControlType) {
        if (browserRequest.extractSource.browserTab.browserControl.uiobjectControlType === 'MAINFRAME') {
            return true;
        }
    }
    return false;
}

function isFrameOrMainframeControlTypeExecuteJs(browserRequest) {
    if (browserRequest.executeJavaScript && browserRequest.executeJavaScript.browserTab &&
        browserRequest.executeJavaScript.browserTab.browserControl &&
        browserRequest.executeJavaScript.browserTab.browserControl.uiobjectControlType) {
        if (browserRequest.executeJavaScript.browserTab.browserControl.uiobjectControlType === 'IFRAME' || browserRequest.executeJavaScript.browserTab.browserControl.uiobjectControlType === 'MAINFRAME') {
            return true;
        }
    }
    return false;
}

function isMainframeRequestExecuteJs(browserRequest) {
    if (browserRequest.executeJavaScript && browserRequest.executeJavaScript.browserTab &&
        browserRequest.executeJavaScript.browserTab.browserControl &&
        browserRequest.executeJavaScript.browserTab.browserControl.uiobjectControlType) {
        if (browserRequest.executeJavaScript.browserTab.browserControl.uiobjectControlType === 'MAINFRAME') {
            return true;
        }
    }
    return false;
}

function isDomXPathPresent(browserRequest) {
    if (browserRequest && browserRequest.extractSource) {
        if (browserRequest.extractSource.browserTab.browserControl.selectionCriteria.DOMXPath == undefined) {
            return false;
        }
    } else if (browserRequest && browserRequest.executeJavaScript) {
        if (browserRequest.executeJavaScript.browserTab.browserControl.selectionCriteria.DOMXPath == undefined) {
            return false;
        }
    }

    return true;
}

function validateIFrameExecuteJavascriptRequest(context, request) {
    if (request.executeJavaScript && request.executeJavaScript.browserTab &&
        request.executeJavaScript.browserTab.browserControl &&
        request.executeJavaScript.browserTab.browserControl.uiobjectControlType) {
        if (request.executeJavaScript.browserTab.browserControl.uiobjectControlType === 'IFRAME' || request.executeJavaScript.browserTab.browserControl.uiobjectControlType === 'MAINFRAME') {
            context.executeJavascript.isIFrameExecuteJavascriptRequest = true;
        }
    }
}

try {
    module.exports = {
        getOpenURLResponse,
        isFrameOrMainframeControlTypeExecuteJs,
        isMainframeRequestExecuteJs,
        isDomXPathPresent,
        createBrowserTabObject,
        getAllTabsResponse,
        getErrorResponse,
        validateIFrameExecuteJavascriptRequest,
        getNavigateStepResponse,
        getTabResponse,
        sendFinalExtractSourceResponse,
        getCloseTabResponse,
        getPageLoadResponse,
        resetExecutionRetryFields,
        isBasicRequestExtractSource,
        isMainframeRequestExtractSource
    };
} catch (err) { }
