function loadAllScripts() {
    if (typeof window === 'undefined') {
        importScripts(
            './Browser.js',
            './AALogger.js',
            './ExtensionContext.js',
            './ExtensionListenableEvent.js',
            './ExtensionTriggersBrowserActions.js',
            './ExtensionNativeMessaging.js',
            './ExtensionBrowserAction.js',
            './ExtensionRequestResponseUtils.js',
            './ExtensionScriptInjection.js',
            './ExtensionReloadSyncAlarm.js',
            './ExtensionDebuggerCommand.js',
            './ExtensionTabExecutor.js',
            './ExtensionTxml.js',
            './ExtensionChromeActions.js',
            './HTMLEnum.js',
            './ExtensionBrowserShim.js',
            './ExtensionConstants.js'
        );
    }
}
loadAllScripts();


function getChromeVersion() {
    var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    return raw ? parseInt(raw[2], 10) : false;
}

function isInvalidBrowser() {
    return getChromeVersion() < supportedChromeVersion;
}

chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
        AALogger.log('script', 'Automation 360 Extension installed.', new Date().toLocaleString());
    } else if (details.reason === 'update') {
        AALogger.log('script', 'Automation 360 Extension Refreshed.', new Date().toLocaleString());
    }
});

chrome.runtime.onSuspend.addListener(() => {
    AALogger.log('script', 'Unloading Automation 360 Extension.', new Date().toLocaleString());
});

var protocol = null;

function activateExtension() {
    // After checking if this extension is not disabled (per the options), connect the native messenger and start up.

    function startNativeMessaging() {
        protocol = new ExtensionNativeMessaging(processRequest);
        protocol.Connect();
    }

    chrome.storage.sync.get(
        {
            'disableNativeMessaging': false
        },
        function (storedResult) {
            if (!storedResult.disableNativeMessaging && !isInvalidBrowser()) {
                startNativeMessaging();
            }
        }
    );

    try {
        chrome.storage.sync.onChanged.addListener((change) => {
            AALogger.log('messenger', 'change event detected in storage', change);
            if (change.disableNativeMessaging) {
                if (change.disableNativeMessaging.newValue && protocol) {
                    AALogger.log('messenger', 'change event deactivating native messaging', change.disableNativeMessaging);
                    protocol.Disconnect();
                    protocol = null;
                }
                if (!change.disableNativeMessaging.newValue && !protocol) {
                    AALogger.log('messenger', 'change event activating native messaging', change.disableNativeMessaging);
                    startNativeMessaging();
                }
            }
        });
    } catch (e) {
        AALogger.error('ExtensionBackgroundLoader', 'adding chrome storage listener', e.message);
    }

    startAAReloadAlarm();
}

activateExtension();

function processRequest(context, request) {
    context.recorder.action.lastCommand = 'None';
    if (context.activeRequest.originalRequest.indexOf('{') === 0) {
        executeBrowserRequest(context, context.activeRequest.request);
    } else {
        onSocketDataReceive(context, request);
    }
}

function executeBrowserRequest(context, browserRequest) {
    try {
        if (browserRequest.getTabList) {
            getAllTabs(context);
        } else if (browserRequest.findTab) {
            if (browserRequest.findTab.tabId) {
                activateTab(context, browserRequest);
            } else {
                findTab(context, browserRequest);
            }
        } else if (browserRequest.findTabByRegex) {
            findTab(context, browserRequest);
        } else if (browserRequest.openUrl) {
            browserRequest.openUrl.url = browserRequest.openUrl.url.trim();
            if (browserRequest.openUrl.openInExistingTab) {
                openUrlInExistingTab(context, browserRequest);
            } else {
                openUrlInNewTab(context, browserRequest);
            }
        } else if (browserRequest.navigateSteps) {
            goBack(context, browserRequest);
        } else if (browserRequest.closeTab) {
            if (browserRequest.closeTab.closeContainingWin) {
                closeContainingWindow(context, browserRequest);
            } else {
                closeTab(context, browserRequest);
            }
        } else if (browserRequest.waitForDocumentStatus) {
            getDocumentStatus(context, browserRequest);
        } else if (browserRequest.extractSource) {
            if (isMainframeRequestExtractSource(browserRequest) || isBasicRequestExtractSource(browserRequest)) {
                extractPageSourceBasic(context, browserRequest);
            } else {
                extractFrameSource(context, browserRequest);
            }
        } else if (browserRequest.executeJavaScript) {
            if (browserRequest.executeJavaScript.securityPolicyViolationState !== undefined && browserRequest.executeJavaScript.securityPolicyViolationState === true) {
                executeJavaScriptWithDebugger(context, browserRequest);
            } else if (browserRequest.executeJavaScript.securityPolicyViolationState !== undefined && browserRequest.executeJavaScript.securityPolicyViolationState === false) {
                executeJavascript(context, browserRequest);
            } else {
                checkContentSecurityPolicyForExecuteJS(context, browserRequest);
            }
        } else if (browserRequest.registerTrigger) {
            addTrigger(context, browserRequest);
        } else if (browserRequest.unregisterTrigger) {
            removeTrigger(context, browserRequest);
        } else if (browserRequest.executeDebuggerCommand) {
            executeDebuggerCommand(context, browserRequest);
        }

    } catch (e) { }
}

async function onSocketDataReceive(context, request) {
    context.registerListenerDuringRequest(
        chrome.runtime.onMessage,
        function(context, messageRequest, sender, sendResponse) {
            if (messageRequest && messageRequest.type) {
                return;
            }
            // what makes this a valid response? not having a type?
            AALogger.info('script', 'onSocketDataReceive', 'messageRequest', messageRequest);
            context.sendResponse(messageRequest);
            sendResponse(true);
        }
    );

    var xmlRequestBody = request.data;
    try {
        if (xmlRequestBody !== '') {
            if (xmlRequestBody.search('ClientID:') !== -1) {
                if (Browser.type === HTMLBrowsers.Firefox) {
                    context.reqForWinHandle.requestHandlerCnt = 0;
                    // TODO: When v3 is ready for Firefox, possibly will need to refactor
                    if (content.document.readyState === HTMLDocumentStatus.COMPLETE || content.document.readyState === HTMLDocumentStatus.INTERACTIVE) {
                        requestHandle(context);
                    } else {
                        gBrowser.addEventListener('DOMContentLoaded', function (event) {
                            documentLoadComplete(context, event);
                        }, true);
                    }
                } else {
                    setTimeout(function () {
                        if (context.response.isRequestSent === false) {
                            context.sendResponse({ data: `Configuration: Service;HTML;${Browser.agentName}` });
                            context.response.isRequestSent = true;
                        }
                    }, 200);
                }
            } else if (xmlRequestBody.search(HTMlRequestAction.REQFORWINHANDLE) !== -1) {
                context.response.isRequestSent = false;
                if (xmlRequestBody.substring(16) === '') {
                    if (context.reqForWinHandle.requestHandlerCnt < 60) {
                        context.reqForWinHandle.requestHandlerCnt++;
                        context.reqForWinHandle.requestHandleTimeOutId = setTimeout(requestHandle, 500);
                    }
                } else {
                    context.response.wHandle = xmlRequestBody.substring(16);
                    gBrowser.tabContainer.childNodes[0].setAttribute('wHandle', context.response.wHandle);
                    if (context.response.isRequestSent === false) {
                        context.sendResponse({ data: `Configuration: Service;HTML;TA-CBS-FIREFOX-AGENT${context.response.wHandle}` });
                        context.response.isRequestSent = true;
                    }
                }
            } else if (xmlRequestBody.search(HTMlRequestAction.OPEN_URL) !== -1 || xmlRequestBody.search(HTMlRequestAction.GET_URL) !== -1) {
                AALogger.log('script', 'OPEN URL OR GET URL', tab);
                try {
                    if (Browser.type === HTMLBrowsers.Chrome) {
                        var tab = undefined;
                        try {
                            tab = await getActiveTab();
                            if (tab) {
                                ExtensionTabExecutor(context, xmlRequestBody, tab);
                            }
                        } catch (e) {
                            AALogger.warn('script', 'OPEN URL OR GET URL', 'getActiveTab', e);
                        }
                    } else if (Browser.type === HTMLBrowsers.Firefox) {
                        browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                            for (const tab of tabs) {
                                ExtensionTabExecutor(context, xmlRequestBody, tab);
                            }
                        });
                    }
                } catch (e) {
                    AALogger.warn('script', 'OnSocketDataReceive', e);
                    context.sendResponse({ data: '<AAOABResult Result=\'false\' Error=\'None\'></AAOABResult>' });
                    context.tabExecution.isOpenURL = false;
                    context.tabExecution.selectedTabId = -1;
                    clearTimeout(context.tabExecution.lastTimeOutId);
                }
            } else if (xmlRequestBody.search(HTMlRequestAction.PAGELOADSTATUS) !== -1) {
                var isDocumentReady = false;
                var tab = undefined;
                try {
                    tab = await getActiveTab();
                    if (tab && tab.id) {
                        chrome.tabs.sendMessage(tab.id, { checkDocumentReadyState: true }, function (documentStateResponse) {
                            if (documentStateResponse === HTMLDocumentStatus.COMPLETE || documentStateResponse === HTMLDocumentStatus.INTERACTIVE) {
                                isDocumentReady = true;
                            }

                            context.sendResponse({ data: `<PAGELOADSTATUS>${isDocumentReady}</PAGELOADSTATUS>` });
                        });
                    }
                } catch (e) {
                    AALogger.warn('script', 'PAGELOADSTATUS', 'getActiveTab', e);
                }
            } else if (xmlRequestBody.indexOf(PLUGINCOMMAND) !== -1 || xmlRequestBody.search(HTMlRequestAction.APPLETRECT) !== -1) {
                if (Browser.type === HTMLBrowsers.Chrome || Browser.type === HTMLBrowsers.Edge) {
                    if (xmlRequestBody.indexOf(HTMlRequestAction.TYPE_MAPPING) > 0) {
                        context.response.objectMapperXml = xmlRequestBody;
                        var tab = undefined;
                        try {
                            tab = await getActiveTab();
                            if (tab && tab.id) {
                                chrome.tabs.sendMessage(tab.id, { mapperXML: context.response.objectMapperXml }, function () {
                                    checkChromeError();
                                    context.sendResponse({ data: '<AAOABResult Result=\'true\'></AAOABResult>' });
                                });
                            }
                        } catch (e) {
                            AALogger.warn('script', 'TYPE_MAPPING', 'getActiveTab', e);
                        }
                    } else if (!skipCommandIfAlertPopupIsOpen(xmlRequestBody, context)) {
                        context.response.chromeResponseText = xmlRequestBody;
                        chromeWaitLoadComplete(context);
                    }
                } else if (Browser.type === HTMLBrowsers.Firefox) {
                    if (xmlRequestBody.indexOf(HTMlRequestAction.TYPE_MAPPING) > 0) {
                        context.response.objectMapperXml = xmlRequestBody;
                        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                            chrome.tabs.sendMessage(tabs[0].id, { mapperXML: context.response.objectMapperXml }, function (response) {
                                context.sendResponse({ data: '<AAOABResult Result=\'true\'></AAOABResult>' });
                            });
                        });
                    } else {
                        context.document.waitingTime = parseInt(getPlayWait(context, xmlRequestBody));
                        context.response.chromeResponseText = xmlRequestBody;
                        context.document.chromeWaitTime = (new Date()).getTime();
                        context.document.waitingTime = context.document.chromeWaitTime + (context.document.waitingTime * 1000);
                        firefoxWaitLoadComplete(context);
                    }
                }
            }
        }
    } catch (e) {
        AALogger.error('ExtensionBackgroundLoader', 'onSocketDataReceive', e.message);
        context.sendResponse(`ERROR: ${e.message}`);
    }
}

function skipCommandIfAlertPopupIsOpen (xmlRequestBody, context) {
    if (xmlRequestBody.indexOf(HTMlRequestAction.PLAY_OBJECT_ACTION) > 0) {
        context.recorder.action.lastCommand = HTMlRequestAction.PLAY_OBJECT_ACTION;
    }

    if (context.recorder.isAlertWindowOpen) {
        if (xmlRequestBody.indexOf(HTMlRequestAction.DETECT_OBJECT_NODE) > 0 ||
            xmlRequestBody.indexOf(HTMlRequestAction.CAPTURE_OBJECT_NODE) > 0) {
            context.sendResponse({ data: '<PluginObjectNode></PluginObjectNode>' });
            return true;
        }
    }

    context.document.waitingTime = parseInt(getPlayWait(context, xmlRequestBody));
    context.document.chromeWaitTime = new Date().getTime();
    context.document.waitingTime = context.document.chromeWaitTime + (context.document.waitingTime * 1000);
    return false;
}

function getPlayWait(context, xmlRequestBody) {
    var parsedXml = txml.parse(xmlRequestBody);
    for (const element of parsedXml) {
        if (element.tagName === PLUGINCOMMAND) {
            for (const child of element.children) {
                var propertyName = child.attributes.Nam;
                var propertyValue = child.attributes.Val;
                switch (propertyName) {
                    case 'PlayWait':
                        if (propertyValue === '0') {
                            return '15';
                        }
                        return propertyValue;
                }
            }
        }
    }

    return '15';
}

function documentLoadComplete(context, event) {
    try {
        event.originalTarget.defaultView.addEventListener('unload', function (event) {
            AALogger.log('script', 'documentLoadComplete', 'event', event);
        }, true);
        if (event.originalTarget instanceof HTMLDocument) {
            var win = event.originalTarget.defaultView;

            if (win.frameElement) {
                return;
            }

            requestHandle(context);
        }
    } catch (e) {
        AALogger.error('ExtensionBackgroundLoader', 'documentLoadComplete', e.message);
    }
}

function requestHandle(context) {
    clearTimeout(context.reqForWinHandle.requestHandleTimeOutId);
    var title = gBrowser.contentTitle;

    if (title === '') {
        title = gBrowser.currentURI.spec;
        if (title.indexOf('#') !== -1) {
            title = title.substring(0, gBrowser.currentURI.spec.indexOf('#'));
        }
    }

    if (title === 'about:blank' && context.reqForWinHandle.titleVerificationCounter < 4) {
        context.reqForWinHandle.requestHandlerCnt++;
        context.reqForWinHandle.titleVerificationCounter += 1;
        setTimeout(function () {
            requestHandle(context);
        }, 500);
    } else if (!context.response.isRequestSent) {
        context.response.isRequestSent = true;
        context.sendResponse({ data: `REQFORWINHANDLE:${title} - Mozilla Firefox` });
        context.reqForWinHandle.titleVerificationCounter = 0;
    }
}

function sendCrossDomainCaptureRequest(context, xmlRequestBody) {
    var parsedXml = txml.parse(xmlRequestBody.data);
    var src = undefined;
    var crossdomainframeindex = undefined;
    var ParentObject = undefined;
    for (const element of parsedXml) {
        if (element.tagName === PLUGINCOMMAND) {
            for (const child of element.children) {
                var propertyName = child.attributes.Nam;
                var propertyValue = child.attributes.Val;
                switch (propertyName) {
                    case 'src':
                        src = propertyValue;
                        break;
                    case 'CrossdomainIframeIndex':
                        crossdomainframeindex = propertyValue;
                        break;
                    case 'ParentObject':
                        ParentObject = propertyValue;
                        break;
                }
            }
        }
    }
    if (crossdomainframeindex !== undefined) {
        sendRequestToFrame(context, src, xmlRequestBody.data, crossdomainframeindex, ParentObject);
    }
}
function playCrossDomainRequest(context, xmlRequestBody) {
    var parsedXml = txml.parse(xmlRequestBody.data);
    var src = undefined;
    var crossdomainframeindex = undefined;
    var parentleft = undefined;
    var parenttop = undefined;
    for (const element of parsedXml) {
        if (element.tagName === PLUGINCOMMAND) {
            for (const child of element.children) {
                var propertyName = child.attributes.Nam;
                var propertyValue = child.attributes.Val;
                switch (propertyName) {
                    case 'CrossDomainFrameIndex':
                        crossdomainframeindex = propertyValue;
                        break;
                    case 'ParentLeft':
                        parentleft = propertyValue;
                        break;
                    case 'ParentTop':
                        parenttop = propertyValue;
                        break;
                }
            }
        }
    }
    parsedXml = txml.parse(context.response.chromeResponseText);

    for (const element of parsedXml) {
        if (element.tagName === PLUGINCOMMAND) {
            for (const child of element.children) {
                var propertyName = child.attributes.Nam;
                var propertyValue = child.attributes.Val;
                switch (propertyName) {
                    case 'FrameDOMXPath':
                        child.attributes.Nam = 'IsCrossDomainRequest';
                        child.attributes.Val = 'true';
                        break;
                    case 'IEFrameSrc':
                        src = propertyValue;
                        break;
                    case 'ParentLeft':
                        if (typeof parentleft !== 'undefined'){
                        child.attributes.Val = parentleft;
                        }
                        break;
                    case 'ParentTop':
                    if (typeof parenttop !== 'undefined'){
                        child.attributes.Val = parenttop;
                    }
                        break;
                }
            }
        }
    }

    if (crossdomainframeindex !== undefined) {
        // If we have a cross domain play request, need to set frame id in request for inline js tag case
        setCrossDomainFrameIdChildInXml(parsedXml, crossdomainframeindex);
        sendRequestToFrame(context, src, txml.stringify(parsedXml), crossdomainframeindex);
    }
}

function setCrossDomainFrameIdChildInXml(parsedXml, frameId) {
    var child = getCrossDomainFrameIdChild(frameId);
    for (const element of parsedXml) {
        if (element.tagName === PLUGINCOMMAND) {
            element.children.push(child);
        }
    }
}

function getCrossDomainFrameIdChild(frameId) {
    var crossDomainFrameIdChild = {
        tagName: 'Prop',
        attributes: {
            Nam: 'FrameIndex',
            Val: frameId
        },
        children: []
    };
    return crossDomainFrameIdChild;
}

async function sendRequestToFrame(context, url, xmlString, frameindex, ParentObject) {
    var tab = undefined;
    try {
        tab = await getActiveTab();
        if (tab && tab.status !== HTMLDocumentStatus.LOADING) {
            var requestSent = false;
            var frameId = parseInt(frameindex, 10);

            chrome.tabs.sendMessage(tab.id, { method: xmlString, browser: Browser.type, 'IsOABRequest': true }, { frameId: frameId }, function (response) {
                checkChromeError();
                requestSent = true;
                return routeResponse(context, response);
            });

            if (requestSent === false && ParentObject && frameId < 0) {
                context.sendResponse({ data: ParentObject });
            }
        } else {
            context.document.chromeWaitTime = (new Date()).getTime();
            if (context.document.waitingTime > context.document.chromeWaitTime) {
                setTimeout(function () {
                    sendRequestToFrame(context, url, xmlString, frameId, ParentObject);
                }, 1000);
            } else {
                context.sendResponse({ data: '<AAOABResult Result=\'false\' Error=\'NullObject\'></AAOABResult>' });
            }
        }
    } catch (e) {
        AALogger.warn('script', 'sendRequestToFrame', 'getActiveTab', e);
    }
}

async function chromeWaitLoadComplete(context) {
    AALogger.log('script', 'chromeWaitLoadComplete');
    var tab = undefined;
    try {
        tab = await getActiveTab();
        if (tab && tab.status !== HTMLDocumentStatus.LOADING) {
            if (tab.url.startsWith(chromeUrltobeIgnored) || tab.url.startsWith(edgeUrltobeIgnored)) {
                context.sendResponse({ data: '<AAOABResult Result=\'false\' Error=\'ContainScriptNotAvailable\'></AAOABResult>' });
                return;
            }

            var sendState = {
                isResponseSent: false
            };

            chrome.webNavigation.getAllFrames({ tabId: tab.id }, function (frames) {
                AALogger.log('script', 'getAllFrames', `length: ${frames.length}`);
                for (var i = 0; i < frames.length; i++) {
                    if (frames[i].parentFrameId === -1) {
                        chrome.tabs.sendMessage(tab.id, { method: context.response.chromeResponseText, browser: Browser.type, 'IsOABRequest': true }, { frameId: frames[i].frameId }, function (response) {
                            checkChromeError();
                            return routeResponse(context, response, sendState);
                        });
                    }
                }
            });
        } else {
            context.document.chromeWaitTime = new Date().getTime();
            if (context.document.waitingTime > context.document.chromeWaitTime) {
                setTimeout(function () {
                    chromeWaitLoadComplete(context);
                }, 1000);
            } else {
                AALogger.warn('script', 'chromeWaitLoadComplete', 'sending error back');
                context.sendResponse({ data: '<AAOABResult Result=\'false\' Error=\'NullObject\'></AAOABResult>' });
            }
        }
    } catch (e) {
        AALogger.warn('script', 'chromeWaitLoadComplete', 'getActiveTab', e);
    }
}

function routeResponse(context, response, sendState) {
    if (response && response.data.includes(HTMlRequestAction.CAPTURE_OBJECT_NODE)) {
        AALogger.log('script', 'routeResponse', 'sendCrossDomainCaptureRequest');
        sendCrossDomainCaptureRequest(context, response);
        return;
    }

    if (response && (response.data.includes(HTMlRequestAction.PLAY_OBJECT_ACTION) || response.data.includes(HTMlRequestAction.SEARCH_OBJECT))) {
        AALogger.log('script', 'routeResponse', 'playCrossDomainRequest');
        playCrossDomainRequest(context, response);
        return;
    }

    if (sendState) {
        AALogger.log('script', 'routeResponse', 'sendState', response);
        if (sendState.isResponseSent !== true) {
            sendState.isResponseSent = true;
            context.sendResponse(response);
        }
    } else {
        AALogger.log('script', 'routeResponse', response);
        context.sendResponse(response);
    }

}

function firefoxWaitLoadComplete(context) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const tab = tabs[0];
        if (tab.status !== HTMLDocumentStatus.LOADING) {
            if (tab.url === 'about:newtab') {
                context.sendResponse({ data: '<AAOABResult Result=\'false\' Error=\'ContainScriptNotAvailable\'></AAOABResult>' });
                return;
            }
            context.response.isResponseSent = false;
            chrome.tabs.sendMessage(tab.id, { method: context.response.chromeResponseText, browser: Browser.type, 'IsOABRequest': true }, function (response) {
                return routeResponse(context, response);
            });
        } else {
            context.document.chromeWaitTime = (new Date()).getTime();
            if (context.document.waitingTime > context.document.chromeWaitTime) {
                setTimeout(function() {
                    firefoxWaitLoadComplete(context);
                }, 1000);
            } else {
                context.sendResponse({ data: '<AAOABResult Result=\'false\' Error=\'NullObject\'></AAOABResult>' });
            }
        }
    });
}

try {
    module.exports = {
        routeResponse,
        chromeWaitLoadComplete,
        sendRequestToFrame,
        onSocketDataReceive,
        processRequest,
        requestHandle,
        playCrossDomainRequest,
        loadAllScripts,
        executeBrowserRequest
    };
} catch (e) { }
