async function getAllTabs(context) {
    AALogger.log('script', 'getAllTabs');
    context.beginRequestTimeout('retrieve all tabs');
    var windows = undefined;
    try {
        windows = await retrieveAllWindows();
    } catch (e) {
        AALogger.warn('script', e);
        context.sendResponse(getErrorResponse(e));
        return;
    }

    var tabsList = [];
    for (var windowIndex = 0; windowIndex < windows.length; windowIndex++) {
        for (var tabIndex = 0; tabIndex < windows[windowIndex].tabs.length; tabIndex++) {
            tabsList.push(createBrowserTabObject(windows[windowIndex].tabs[tabIndex]));
        }
    }
    AALogger.log('script', 'successfully retrieved all tabs');
    context.sendResponse(getAllTabsResponse(tabsList));
}

function goBack(context, request) {
    AALogger.log('script', 'goBack', request);
    var tabId = parseInt(request.navigateSteps.tab.tabId, 10);
    context.beginRequestTimeout('perform tab navigation');
    var promises = [];
    var sentError = false;
    for (var i = 0; i < request.navigateSteps.stepCount; i++) {
        const goBackActionPromise = new Promise(function (resolve, reject) {
            chrome.tabs.goBack(tabId, function () {
                if (chrome.runtime.lastError) {
                    AALogger.warn('script', 'goBack', 'error', chrome.runtime.lastError.message);
                    reject({ error: chrome.runtime.lastError.message });
                    if (!sentError) {
                        sentError = true;
                        context.sendResponse(getErrorResponse(chrome.runtime.lastError.message));
                    }
                } else {
                    resolve({ result: 'success' });
                }
            });
        });
        promises.push(goBackActionPromise);
    }
    Promise.allSettled(promises).then((values) => {
        AALogger.log('script', 'goBack', 'promises', promises);
        if (!sentError) {
            AALogger.log('script', 'goBack', 'success');
            context.sendResponse(getNavigateStepResponse());
        }
    });
}

async function openUrlInExistingTab(context, request) {
    AALogger.log('script', 'openUrlInExistingTab');
    var tabId = parseInt(request.openUrl.openInExistingTab.browserTab.tabId, 10);
    context.registerListenerDuringRequest(chrome.tabs.onUpdated, function (context, eventTabId, changeInfo, tab) {
        if (eventTabId === tabId && (changeInfo.status === HTMLDocumentStatus.COMPLETE || changeInfo.status === HTMLDocumentStatus.LOADING)) {
            AALogger.log('script', 'successfully opened url in existing tab');
            context.sendResponse(getOpenURLResponse(tab));
            return;
        } else if (tab && eventTabId === tabId && Browser.type === HTMLBrowsers.Edge) {
            AALogger.log('script', 'successfully opened url in existing tab IE + Edge');
            context.sendResponse(getOpenURLResponse(tab));
            return;
        }
    });
    context.beginRequestTimeout('open url in existing tab');

    var tabQuery = { 'url': request.openUrl.url, 'active': true, 'selected': true };
    try {
        await updateTab(tabId, tabQuery);
    } catch (e) {
        AALogger.warn('script', e);
        context.sendResponse(getErrorResponse(e));
        return;
    }
}

async function openUrlInNewTab(context, request) {
    AALogger.log('script', 'openUrlInNewTab');
    context.registerListenerDuringRequest(chrome.tabs.onCreated, function (context, tab) {
        if (tab && tab.id) {
            AALogger.log('script', 'successfully opened url in new tab');
            context.sendResponse(getOpenURLResponse(tab));
            return;
        }
    });
    context.beginRequestTimeout('open url in new tab');
    var windowQuery = { 'populate': true };
    var window = await getCurrentWindow(windowQuery);
    var tabQuery = { 'active': true, 'windowId': window.windowId, 'url': request.openUrl.url };
    try {
        await createTab(tabQuery);
    } catch (e) {
        AALogger.warn('script', e);
        context.sendResponse(getErrorResponse(e));
        return;
    }
}

async function closeContainingWindow(context, request) {
    AALogger.log('script', 'closeContainingWindow');
    var tabId = parseInt(request.closeTab.tabToClose.tabId, 10);
    var tab = undefined;
    try {
        tab = await getTabById(tabId);
    } catch (e) {
        AALogger.warn('script', e);
        context.sendResponse(getErrorResponse(e));
        return;
    }

    var windowId = tab.windowId;
    context.registerListenerDuringRequest(chrome.windows.onRemoved, function (context, eventWindowId) {
        AALogger.log('script', 'successfully closed window');
        if (windowId === eventWindowId) {
            context.sendResponse(getCloseTabResponse());
            return;
        }
    });
    context.beginRequestTimeout('close tab in window');
    try {
        await removeWindowById(windowId);
    } catch (e) {
        AALogger.warn('script', e);
        context.sendResponse(getErrorResponse(e));
        return;
    }
}

async function closeTab(context, request) {
    var tabId = parseInt(request.closeTab.tabToClose.tabId, 10);
    context.registerListenerDuringRequest(chrome.tabs.onRemoved, function (context, eventTabId, removeInfo) {
        if (eventTabId === tabId) {
            AALogger.log('script', 'successfully closed tab');
            context.sendResponse(getCloseTabResponse());
            return;
        }
    });
    context.beginRequestTimeout('close tab');

    try {
        await removeTabById(tabId);
    } catch (e) {
        AALogger.warn('script', e);
        context.sendResponse(getErrorResponse(e));
        return;
    }
}

async function activateTab(context, request) {
    AALogger.log('script', 'activateTab');
    var tabId = parseInt(request.findTab.tabId, 10);
    var tab = undefined;

    try {
        tab = await getTabById(tabId);
    } catch (e) {
        AALogger.warn('script', e);
        context.sendResponse(getErrorResponse(e));
        return;
    }

    context.registerListenerDuringRequest(chrome.tabs.onActivated, function (context, activeInfo) {
        if (activeInfo.tabId === tabId) {
            AALogger.log('script', 'successfully activated tab');
            context.sendResponse(getTabResponse(tab));
            return;
        }
    });
    context.beginRequestTimeout('activate tab');

    if (tab.active === true) {
        AALogger.log('script', 'tab already active');
        context.sendResponse(getTabResponse(tab));
    } else {
        AALogger.log('script', 'activating tab');
        var updatedTab = undefined;
        try {
            updatedTab = await activateTabByTabId(tab.id);
        } catch (e) {
            AALogger.warn('script', e);
            context.sendResponse(getErrorResponse(e));
            return;
        }
        context.sendResponse(getTabResponse(updatedTab));
    }
}

async function findTab(context, request) {
    AALogger.log('script', 'findTab');
    context.beginRequestTimeout('find tab');

    var tabs = undefined;
    try {
        tabs = await retrieveAllTabs();
    } catch (e) {
        AALogger.warn('script', e);
        context.sendResponse(getErrorResponse(e));
        return;
    }

    for (var i = 0; i < tabs.length; i++) {
        if (request.findTab && request.findTab.lastUsedTab) {
            if (tabs[i].active === true) {
                context.sendResponse(getTabResponse(tabs[i]));
                return;
            }
        } else if (isTabMatch(tabs[i], request)) {
            AALogger.log('script', 'found tab match');
            if (tabs[i].active === true) {
                AALogger.log('script', 'tab already active');
                context.sendResponse(getTabResponse(tabs[i]));
            } else {
                AALogger.log('script', 'activating tab');
                let activatedTab = undefined;
                try {
                    activatedTab = await activateTabByTabId(tabs[i].id);
                } catch (e) {
                    AALogger.warn('script', e);
                    context.sendResponse(getErrorResponse(e));
                    return;
                }
                AALogger.log('script', 'activated tab');
                context.sendResponse(getTabResponse(activatedTab));
            }

            return;
        }
    }
    var errorMessage = undefined;
    if (request.findTab.name) {
        errorMessage = `Tab '${request.findTab.name}' not found`;
    } else {
        errorMessage = `Tab not found with regex pattern match '${request.findTab.nameRegex}'`;
    }

    context.sendResponse(getErrorResponse(errorMessage));
    return;
}

function javascriptExecutorFunc(wrapperCode, eventName) {
    var code = wrapperCode;
    try {
        window.addEventListener(eventName, function OnExecuteJs(event) {
            if (event.detail === null) {
                AALogger.log('script', 'found null event detail');
                chrome.runtime.sendMessage({ type: 'executeJavascriptResponse', returnValue: { type: 'executeJavascriptResponse', returnValue: null } }, () => checkChromeError());
                window.removeEventListener(eventName, OnExecuteJs);
            }

            if (event.detail && (event.detail.type === 'crossDomainIFrameInfo' ||
                event.detail.type === 'executeJavascriptResponse' ||
                event.detail.type === 'executeJavascriptError')) {
                chrome.runtime.sendMessage({ type: event.detail.type, returnValue: event.detail }, () => checkChromeError());
                window.removeEventListener(eventName, OnExecuteJs);
            }
        });
        var jsDiv = document.createElement('div');
        jsDiv.setAttribute('onreset', code);
        var divEvent = new CustomEvent('reset');
        var ev = jsDiv.dispatchEvent(divEvent);
        jsDiv.removeAttribute('onreset');
        jsDiv.remove();
    } catch (e) {
        AALogger.log('script', 'error executing javascript function', e.message);
        chrome.runtime.sendMessage({ errorResponse: e.message }, () => checkChromeError());
    }
}

function waitForPageCompletionAndRoute(context, tabId, request, timeOutMs) {
    AALogger.log('script', 'waitForPageCompletionAndRoute');
    if (!context.activeRequest) {
        return;
    }

    var documentStatusCounter = timeOutMs - 1000;
    if (documentStatusCounter <= 0) {
        AALogger.log('script', 'waitForPageCompletionAndRoute', 'page did not load in time');
    } else if (tabId > 0) {
        chrome.tabs.sendMessage(tabId, { checkDocumentReadyState: true }, function (pageStatus) {
            checkChromeError();
            if (pageStatus === HTMLDocumentStatus.COMPLETE && context.activeRequest) {
                AALogger.log('script', 'waitForPageCompletionAndRoute', 'page complete');
                documentStatusCounter = 0;
                chrome.tabs.sendMessage(tabId, { securityPolicyStatusRequest: request }, function (securityPolicyViolationStateResponse) {
                    routeExecuteJavascriptRequest(context, securityPolicyViolationStateResponse);
                });
            } else {
                AALogger.log('script', 'waitForPageCompletionAndRoute', 'page status not complete, retrying');
                setTimeout(waitForPageCompletionAndRoute, 1000, context, tabId, request, documentStatusCounter);
            }
        });
    }
}

function routeExecuteJavascriptRequest(context, securityPolicyViolationStateResponse) {
    securityPolicyViolationStateResponse.request.executeJavaScript.securityPolicyViolationState = securityPolicyViolationStateResponse.securityPolicyStatusResponse;
    securityPolicyViolationStateResponse.request.executeJavaScript.securityPolicyEventData = securityPolicyViolationStateResponse.securityPolicyEventData;
    executeBrowserRequest(context, securityPolicyViolationStateResponse.request);
}

function checkContentSecurityPolicyForExecuteJS(context, request) {
    var executeJavaScriptRequest = request.executeJavaScript;
    var tabId = parseInt(executeJavaScriptRequest.browserTab.tabId, 10);
    chrome.tabs.sendMessage(tabId, { securityPolicyStatusRequest: request }, function (response) {
        checkChromeError();
        if (response === undefined) {
            waitForPageCompletionAndRoute(context, tabId, request, request.timeOutMs);
        } else {
            routeExecuteJavascriptRequest(context, response);
        }
    });
}

function executeJavaScriptWithDebugger(context, request) {
    context.beginRequestTimeout('execute javascript with debugger');
    var request = {
        tabId: parseInt(request.executeJavaScript.browserTab.tabId, 10),
        debuggerAction: 'executeUserJS',
        commandData: request.executeJavaScript.javaScriptFunction
    };
    executeDebuggerCommand(
        context,
        request,
        (result) => ({ executeJavaScriptResponse: { returnValue: result } })
    );
}

function executeJavascript(context, browserRequest) {
    context.beginRequestTimeout('execute javascript');
    if (context.executeJavascript.isJavaScriptExecutionListenerAdded === false) {
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
            if (request.returnValue && request.returnValue.type === 'executeJavascriptResponse') {
                var response = undefined;
                if (request.returnValue.returnValue) {
                    response = { executeJavaScriptResponse: { returnValue: request.returnValue.returnValue } };
                } else {
                    response = { executeJavaScriptResponse: { returnValue: null } };
                }
                context.sendResponse(response);
            } else if (request.returnValue && request.returnValue.type === 'crossDomainIFrameInfo') {
                var input = request.returnValue.request;
                var domxpath = input.executeJavaScript.browserTab.browserControl.selectionCriteria.DOMXPath.value.string;
                chrome.tabs.sendMessage(tabId, { getFrameId: input, domxpath: domxpath }, function(response) {
                    if (response.frameId && response.frameId !== undefined) {
                        executeJavaScriptInFrame(response.orgRequest, response.frameId);
                    }
                });
            } else if (request.returnValue && request.returnValue.type === 'executeJavascriptError') {
                AALogger.log('script', 'executeJavascriptError', request.returnValue.errorResponse);
                context.sendResponse(getErrorResponse(request.returnValue.errorResponse));
            } else {
                AALogger.log('script', 'unknown response');
            }
            sendResponse(true);
        });
    }
    context.executeJavascript.isJavaScriptExecutionListenerAdded = true;
    var executeJavaScriptRequest = browserRequest.executeJavaScript;
    var tabId = parseInt(executeJavaScriptRequest.browserTab.tabId, 10);
    if (isFrameOrMainframeControlTypeExecuteJs(browserRequest)) {
        if (isMainframeRequestExecuteJs(browserRequest)) {
            executeJavaScriptInMainFrame(browserRequest, tabId);
        } else if (isDomXPathPresent(browserRequest)) {
            validateIFrameExecuteJavascriptRequest(context, browserRequest);
            try {
                if (context.executeJavascript.isIFrameExecuteJavascriptRequest) {
                    var code = executeInFrame(browserRequest);
                    executeScript(tabId, undefined, code);
                } else {
                    executeJavaScriptInMainFrame(browserRequest, tabId);
                }
            } catch (e) {
                AALogger.log('script', e);
            }
        } else {
            executeJavaScriptInMainFrame(browserRequest, tabId);
        }
    } else {
        executeJavaScriptInMainFrame(browserRequest, tabId);
    }
}

function executeJavaScriptInMainFrame(request, tabId) {
    var wrapperCode = javascriptCodeWrapper(request.executeJavaScript.javaScriptFunction, 'automationanywhere-recorder-ExecuteJs', 'executeJavascriptResponse');
    executeScript(tabId, undefined, wrapperCode);
}

function executeJavaScriptInFrame(request, frameId) {
    AALogger.log('script', 'executeJavaScriptInFrame', request);
    var tabId = parseInt(request.browserTab.tabId, 10);
    var wrapperCode = javascriptCodeWrapper(request.javaScriptFunction, 'automationanywhere-recorder-ExecuteJs', 'executeJavascriptResponse');
    var frameIds = [frameId];
    executeScript(tabId, frameIds, wrapperCode);
}

function executeScript(tabId, frameIds, javascriptCode) {
    var hasFrames = frameIds !== undefined && frameIds.length > 0;
    var target = hasFrames ? { tabId: tabId, frameIds: frameIds } : { tabId: tabId };
    AALogger.log('script', 'executeScript', 'target', target);
    chromeExecuteScript(target, javascriptCode, 'automationanywhere-recorder-ExecuteJs')
}

function chromeExecuteScript(target, wrapperCode, customEvent) {
    chrome.scripting.executeScript(
        {
            target: target,
            func: javascriptExecutorFunc,
            args: [wrapperCode, customEvent]
        },
        () => checkChromeError()
    );
}

function interactWithElement(tabId, request, sendResponse) {
    AALogger.log('script', 'interactWithElement', request);
    var wrapperCode = interactWithElementCodeWrapper(request.targetAttribute, request.targetValue, request.elementMethod);
    sendDebuggerCommand(tabId, {
            action: 'executeUserJS',
            commandData: wrapperCode
        }, (result) => {
            AALogger.log('script', result);
            sendResponse({ 'result': result });
        });
}

function getAllFrameIds(allFrames) {
    var frameIds = [];
    for (var i = 0; i < allFrames.length; i++) {
        if (allFrames[i].frameId !== 0) {
            frameIds.push(allFrames[i].frameId);
        }
    }
    return frameIds;
}

function clickElementInCrossDomainFrame(tabId, request) {
    AALogger.log('script', 'clickElementInCrossDomainFrame');
    var frameIds = [request.frameId];
    AALogger.log('script', 'clickElementInCrossDomainFrame', 'frameids', frameIds);
    var clickElementInFrameCode = interactWithElementCodeWrapper(request.targetAttribute, request.targetValue, request.elementMethod);
    var wrapperCode = javascriptCodeWrapper(clickElementInFrameCode, 'automationanywhere-recorder-ExecuteJs', 'executeJavascriptResponse');
    executeScript(tabId, frameIds, wrapperCode);
}

async function clickElementInSameDomainFrame(tabId, request) {
    AALogger.log('script', 'clickElementInSameDomainFrame');
    var frames = await chrome.webNavigation.getAllFrames({ tabId: tabId });
    var frameIds = getAllFrameIds(frames);
    AALogger.log('script', 'clickElementInSameDomainFrame', 'frameids', frameIds);
    var clickElementInFrameCode = interactWithElementCodeWrapper(request.targetAttribute, request.targetValue, request.elementMethod);
    var wrapperCode = javascriptCodeWrapper(clickElementInFrameCode, 'automationanywhere-recorder-ExecuteJs', 'executeJavascriptResponse');
    executeScript(tabId, frameIds, wrapperCode);
}

async function getDocumentStatus(context, request) {
    AALogger.log('script', 'getDocumentStatus');
    if (context.recorder.isAlertWindowOpen === true) {
        context.sendResponse(getPageLoadResponse(true, 'Complete'));
        return;
    }
    context.beginRequestTimeout('get document status');
    var tab = undefined;
    try {
        tab = await getActiveTab();
    } catch (e) {
        AALogger.warn('script', e);
        context.sendResponse(getErrorResponse(e));
        return;
    }

    if (tab.url.startsWith(chromeUrltobeIgnored) || tab.url.startsWith(edgeUrltobeIgnored)) {
        context.sendResponse(getPageLoadResponse(true, 'Complete'));
        return;
    }

    if (tab.status.toLowerCase() === HTMLDocumentStatus.COMPLETE && tab.id > 0) {
        if (context.notCompletedPageTabs.has(tab.id) > 0) {
            chrome.tabs.sendMessage(tab.id, { command: request, browser: Browser.type }, function (message) {
                checkChromeError();
                context.sendResponse(getPageLoadResponse(message.status, message.pagestatus));
            });
        } else {
            context.sendResponse(getPageLoadResponse(true, 'Complete'));
        }
    } else {
        setTimeout(function () {
            return documentStateWait(context, tab, request, request.timeOutMs);
        }, 1000, request, request.timeOutMs);
    }
}

async function documentStateWait(context, tab, request, timeOutMs) {
    AALogger.log('script', 'documentStateWait');
    if (!context.activeRequest) {
        return;
    }

    tab = await getActiveTab();

    var documentStatusCounter = timeOutMs - 1000;
    if (documentStatusCounter <= 0) {
        AALogger.log('script', 'waiting for page status to be complete');
        context.sendResponse({ result: { status: false, pagestatus: 'unknown' } });
    } else if (tab.status === HTMLDocumentStatus.COMPLETE && tab.id > 0) {
            chrome.tabs.sendMessage(tab.id, { checkDocumentReadyState: true }, function (message) {
                checkChromeError();
                if (message === HTMLDocumentStatus.COMPLETE && context.activeRequest) {
                    AALogger.log('script', 'page status is complete');
                    context.sendResponse(getPageLoadResponse(true, 'Complete'));
                    documentStatusCounter = 0;

                } else {
                    AALogger.log('script', 'page status not complete yet');
                }
            });
    } else {
        AALogger.log('script', 'documentStateWait', 'status not complete, retrying');
        setTimeout(documentStateWait, 1000, context, tab, request, documentStatusCounter);
    }
}

function extractPageSourceBasic(context, request) {
    AALogger.log('script', 'extractPageSourceBasic');
    context.beginRequestTimeout('extract source from page');
    var tabId = parseInt(request.extractSource.browserTab.tabId, 10);
    chrome.tabs.sendMessage(tabId, { extractSource: 'basic_extract_source', browser: Browser.type }, function(response) {
        return basicExtractPageSourceCallBack(context, response);
    });
}

function basicExtractPageSourceCallBack(context, response) {
    AALogger.log('script', 'sending final basic extract page source response', response);
    sendFinalExtractSourceResponse(context, response);
}

function extractFrameSource(context, request) {
    AALogger.log('script', 'extractFrameSource');
    context.beginRequestTimeout('extract source from frame');
    var tabId = parseInt(request.extractSource.browserTab.tabId, 10);
    context.extractSource.retryTabId = tabId;
    context.extractSource.isIFrameExtractSourceRequest = true;
    var hasDomXPath = isDomXPathPresent(request);
    if (hasDomXPath) {
        context.extractSource.retryXpath = request.extractSource.browserTab.browserControl.selectionCriteria.DOMXPath.value.string;
        chrome.tabs.sendMessage(tabId, { extractSource: request, browser: Browser.type }, function (response) {
            return extractFrameSourceCallBack(context, response);
        });
    } else {
        var selectionCriteria = request.extractSource.browserTab.browserControl.selectionCriteria;
        chrome.tabs.sendMessage(tabId, { framerequest: selectionCriteria, browser: Browser.type }, function (response) {
            return extractFrameSourceCallBack(context, response);
        });
    }
}

function extractFrameSourceCallBack(context, response) {
    if (response && response.errorResult && response.errorResult.includes('Action cannot be performed')) {
        sendFinalExtractSourceResponse(context, response);
        return;
    }

    if (response && response.result > 0) {
        context.extractSource.frameIndexResponse = response;
        executeCrossDomainFrameSourceRequest(context);
    } else if (response && response.result) {
        sendFinalExtractSourceResponse(context, response);
        return;
    }

    if (response === undefined) {
        var input = {
            retry: true,
            xpath: context.extractSource.retryXpath
        };
        // handling an undefined response from cross domain iframe
        if (context.extractSource.retryTabId) {
            chrome.tabs.sendMessage(context.extractSource.retryTabId, { extractSource: input, browser: Browser.type }, function (retryResponse) {
                context.extractSource.frameIndexResponse = retryResponse;

                if (context && context.extractSource.frameIndexResponse && context.extractSource.frameIndexResponse.result > 0) {
                    executeCrossDomainFrameSourceRequest(context);
                }
            });
        }
    }

    if (response === undefined && !context.extractSource.frameIndexFound && context.extractSource.isIFrameExtractSourceRequest) {
        context.extractSource.retries++;
        setTimeout(function () {
            return extractFrameSourceCallBack(context, response);
        }, 2000);
        if (context.extractSource.frameIndexResponse !== undefined) {
            if (context.extractSource.frameIndexResponse.result > 0) {
                context.extractSource.frameIndexFound = true;
            }
        }
    } else if (context.extractSource.frameIndexFound) {
        // Frame index is already present
        executeCrossDomainFrameSourceRequest(context);
    } else if (!context.extractSource.isIFrameExtractSourceRequest) {
        // standard html source extraction logic
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
}

function executeCrossDomainFrameSourceRequest(context) {
    var frameRequest = {
        extract: true,
        selectionCriteria: context.extractSource.retrySelectionCriteria
    };
    chrome.tabs.sendMessage(context.extractSource.retryTabId, { crossdomainframe: frameRequest, browser: Browser.type }, { frameId: context.extractSource.frameIndexResponse.result }, function (response) {
        sendFinalExtractSourceResponse(context, response);
        // reset fields used for retry
        resetExecutionRetryFields(context);
    });
}

function isTabMatch(tab, request) {
    if (request.findTabByRegex) {
        try {
            var pattern = new RegExp(request.findTabByRegex.nameRegex, request.findTabByRegex.nameRegexFlags);
            return pattern.test(tab.title);
        } catch (e) {
            return false;
        }
    } else if (request.findTab) {
        if (request.findTab.name) {
            if (request.findTab.nameCaseInsensitive) {
                return tab.title.toLowerCase() === request.findTab.name.toLowerCase();
            }

            return tab.title === request.findTab.name;

        } else if (request.findTab.nameRegex) {
            try {
                if (request.findTab.nameCaseInsensitive) {
                    var pattern = new RegExp(request.findTab.nameRegex, 'i');
                    return pattern.test(tab.title);
                }

                var pattern = new RegExp(request.findTab.nameRegex);
                return pattern.test(tab.title);

            } catch (e) {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }
}

try {
    module.exports = {
        getAllTabs,
        goBack,
        openUrlInExistingTab,
        openUrlInNewTab,
        closeContainingWindow,
        closeTab,
        activateTab,
        executeCrossDomainFrameSourceRequest,
        extractFrameSource,
        basicExtractPageSourceCallBack,
        checkContentSecurityPolicyForExecuteJS,
        executeJavaScriptInMainFrame,
        documentStateWait,
        getDocumentStatus,
        findTab,
        isTabMatch,
        javascriptExecutorFunc,
        extractPageSourceBasic,
        executeJavaScriptWithDebugger,
        extractFrameSourceCallBack,
        executeJavaScriptInFrame,
        executeJavascript,
        executeScript,
        clickElementInCrossDomainFrame,
        clickElementInSameDomainFrame,
        interactWithElement,
        getAllFrameIds,
        routeExecuteJavascriptRequest,
        waitForPageCompletionAndRoute,
        chromeExecuteScript
    };
} catch (e) { }
