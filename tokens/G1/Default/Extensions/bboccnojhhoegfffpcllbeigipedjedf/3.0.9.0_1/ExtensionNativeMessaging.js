function ExtensionNativeMessaging(messageReceiveCallback) {
    var context = new Context(this);
    ExtensionNativeMessaging.onSetupContext.fire(context);

    this.Connect = function () {
        port = chrome.runtime.connectNative(Browser.nativeMessagingId);
        context._port = port;
        IsClientRunning = true;
        port.onMessage.addListener(this.OnMessageReceiveCallBack);
        port.onDisconnect.addListener(onDisconnected);
        AALogger.log('messenger', 'connected');
        context._pingInterval = setInterval(ping, 1000);
        setTimeout(function () {
            if (IsClientRunning === false) {
                port.onMessage.removeListener(this.OnMessageReceiveCallBack);
                port.onDisconnect.removeListener(onDisconnected);
            } else {
                reloadContentScript();
            }
        }, 1000);

        ExtensionNativeMessaging.onContextReady.fire(context);
    };

    this.OnMessageReceiveCallBack = function (request) {
        AALogger.log('messenger', 'request: ', request);

        var originalRequest = request.data;
        context.beginRequest(originalRequest, port);

        return messageReceiveCallback(context, request);
    };

    async function reloadContentScript() {
        var contentjsFiles = chrome.runtime.getManifest().content_scripts[0].js;
        var tabs = undefined;
        try {
            tabs = await retrieveAllTabs();
            for (let i = 0; i < tabs.length; i++) {
                if (!(tabs[i].url.startsWith(chromeUrltobeIgnored) || tabs[i].url.startsWith(chromeExtensionUrl))) {
                    chrome.scripting.executeScript(
                        {
                            target: { tabId: tabs[i].id },
                            files: contentjsFiles
                        },
                        () => checkChromeError()
                    );
                }
            }
        } catch (e) {
            AALogger.warn('messenger', 'reloadContentScript', e);
        }
    }

    this.Disconnect = function () {
        if (context._port) {
            AALogger.log('messenger', 'disconnecting');
            context._port.disconnect();
            context._port = null;
            if (context._pingInterval) {
                clearTimeout(context._pingInterval);
            }
        }
    };

    function onDisconnected(port) {
        IsClientRunning = false;
        port.onMessage.removeListener(this.OnMessageReceiveCallBack);
        port.onDisconnect.removeListener(onDisconnected);
        setTimeout(function () {
            chrome.runtime.reload();
        }, 15000);
    }
}

/**
 * Event fired when a new context is created.
 * Registered listeners can add their own properties to the context
 * in this event.
 * The event callback is called with the following params:
 * @param {Object} context the new context instance
 */
ExtensionNativeMessaging.onSetupContext = new ListenableEvent('onSetupContext');

/**
 * Event fired when the Context instance is ready.
 * Registered listeners can perform setup that needs access to the context
 * in this event.
 * The event callback is called with the following params:
 * @param {Object} context the shared context instance
 */
ExtensionNativeMessaging.onContextReady = new ListenableEvent('onContextReady');

/**
 * Event fired when a message request is received from the native port.
 * The event callback is called with the following params:
 * @param {Object} context the shared context instance
 * @param {Object} request the parsed incoming request
 */
ExtensionNativeMessaging.onMessage = new ListenableEvent('onMessage');

function ping() {
 AALogger.log('messenger', 'ping');
}

ExtensionNativeMessaging.onSetupContext.addListener((context) => {
    Object.assign(context, {
        triggers: {
            windowTitleJournal: new Map(),
            triggerTabRegistry: new Map(),
            triggerRegistry: new Map(),
            isTriggerListenerRegistered: false
        },
        recorder: {
            action: {
                lastCommand: 'None'
            },
            isAlertWindowOpen: false
        },
        extractSource: {
            retryTabId: undefined,
            retryXpath: undefined,
            retries: 0,
            frameIndexResponse: undefined,
            frameIndexFound: false,
            isIFrameExtractSourceRequest: false,
            retrySelectionCriteria: undefined
        },
        executeJavascript: {
            retryXpath: undefined,
            isIFrameExecuteJavascriptRequest: false,
            isJavaScriptExecutionListenerAdded: false
        },
        response: {
            objectMapperXml: '',
            chromeResponseText: undefined,
            edgeResponseText: undefined,
            isRequestSent: false,
            wHandle: undefined,
            isResponseSent: false
        },
        document: {
            waitFor: 20000,
            waitingTime: 0,
            chromeWaitTime: 0
        },
        tabExecution: {
            isOpenURL: false,
            selectedTabId: -1,
            lastTimeOutId: undefined
        },
        reqForWinHandle: {
            requestHandleTimeOutId: undefined,
            requestHandlerCnt: 0,
            titleVerificationCounter: 0
        },
        notCompletedPageTabs: new Map()
    });
});

// TODO: split this up too
ExtensionNativeMessaging.onSetupContext.addListener((context) => {
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        if (sender.tab) {
            if (request.type === 'GET_MAPPER_DICTIONARY') {
                sendResponse({ mapperXML: context.response.objectMapperXml });
            } else if (request.type === AlertEvents.ALERT_OPEN) {
                context.recorder.isAlertWindowOpen = true;
                if (context.recorder.action.lastCommand === HTMlRequestAction.PLAY_OBJECT_ACTION) {
                    context.sendResponse({ data: '<AAOABResult Result=\'true\' Error=\'None\'> <Table></Table></AAOABResult>' });
                }
            } else if (request.type === AlertEvents.ALERT_CLOSE) {
                context.recorder.isAlertWindowOpen = false;
            } else if (request.type === 'INTERACT_WITH_ELEMENT') {
                interactWithElement(sender.tab.id, request, sendResponse);
                return true;
            } else if (request.type === 'INTERACT_WITH_ELEMENT_SAMEDOMAIN_FRAME') {
                clickElementInSameDomainFrame(sender.tab.id, request);
                return true;
            } else if (request.type === 'INTERACT_WITH_ELEMENT_CROSSDOMAIN_FRAME') {
                clickElementInCrossDomainFrame(sender.tab.id, request);
                return true;
            }
        }
    });

    // Fired when a navigation is committed. The document (and the resources it refers to, such as images and subframes)
    // might still be downloading, but at least part of the document has been received from the server and the browser has decided to switch to the new document.
    // we are adding tab id and url in our map
    chrome.webNavigation.onCommitted.addListener(function (data) {
        if (data.parentFrameId === -1) {
            context.notCompletedPageTabs.set(data.tabId, data.url);
        }
    });

    // Fired when a navigation is about to occur.
    // we are removing tab id from map.(Open new url or change url)
    chrome.webNavigation.onBeforeNavigate.addListener(function (data) {
        if (data.parentFrameId === -1) {
            context.notCompletedPageTabs.delete(data.tabId);
        }
    });

    // Fired when an Error Occurred.
    // we are checking specific error amd set map value
    chrome.webNavigation.onErrorOccurred.addListener(function (data) {
        if (data.parentFrameId === -1 && data.error.indexOf('net::ERR_INVALID_AUTH_CREDENTIALS') > 0) {
            context.notCompletedPageTabs.set(data.tabId, data.url);
        } else {
            context.notCompletedPageTabs.delete(data.tabId);
        }
    });

    // Fired when a tab is closed.
    chrome.tabs.onRemoved.addListener(function (tabId, removed) {
        context.notCompletedPageTabs.delete(tabId);
        removeTabFromTriggerRegistry(context, tabId);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        handleTriggerOnWindowOnUpdate(context, tabId, changeInfo, tab);
    });
});

try {
    module.exports = ExtensionNativeMessaging;
} catch (e) { };
