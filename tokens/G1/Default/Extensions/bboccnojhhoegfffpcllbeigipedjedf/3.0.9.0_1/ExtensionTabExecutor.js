function ExtensionTabExecutor(context, xmlRequestBody, tab) {
    AALogger.log('ExtensionTabExecutor', 'request', xmlRequestBody);
    context.tabExecution.isOpenURL = true;
    var parsedXml = txml.parse(xmlRequestBody);
    var actionName = undefined;
    var playValue1 = undefined;
    var playValue2 = undefined;

    for (const element of parsedXml) {
        if (element.tagName === PLUGINCOMMAND) {
            for (const child of element.children) {
                var propertyName = child.attributes.Nam;
                var propertyValue = child.attributes.Val;

                switch (propertyName) {
                    case HTMLPropertyEnum.ActionToPlay:
                        actionName = propertyValue;
                        break;
                    case HTMLPropertyEnum.PlayValue1:
                        playValue1 = propertyValue;
                        break;
                    case HTMLPropertyEnum.PlayValue2:
                        playValue2 = propertyValue;
                        break;
                }
            }
        }
    }

    switch (actionName) {
        case HTMLBrowserAction.CheckPageExists:
            checkPageExists(context, playValue1, playValue2);
            break;
        case HTMLBrowserAction.NavigateURL:
            navigateURL(context, playValue1);
            break;
        case HTMLBrowserAction.NewWindow:
            newWindow(context, playValue1);
            break;
        case HTMLBrowserAction.Close:
            close(playValue1);
            break;
        case HTMLBrowserAction.NewTab:
            newTab(context, playValue1);
            break;
        case HTMLBrowserAction.GetCurrentTab:
            getCurrentTab(context, tab);
            break;
        case HTMLBrowserAction.GetURL:
            getURL();
            break;
    }

}

async function getURL() {
    AALogger.log('ExtensionTabExecutor', 'getURL');
    var tab = undefined;
    try {
        tab = await getActiveTab();
        if (tab) {
            var tabUrl = tab.url;
            ws.send(`<AAOABResult Result='true' Error='None'><Vals><Val>${new HTMLCommon(null).ReplaceSpacialCharacter(tabUrl)}</Val></Vals></AAOABResult>`);
        }
    } catch (e) {
        AALogger.error('ExtensionTabExecutor', 'getURL', e.message);
        return;
    }
}

function getCurrentTab(context, tab) {
    AALogger.log('ExtensionTabExecutor', 'getCurrentTab');
    if (tab.status === HTMLDocumentStatus.COMPLETE) {
        context.tabExecution.selectedTabId = tab.id;
        sendPageComplete(context);
    } else {
        context.tabExecution.selectedTabId = tab.id;
        context.tabExecution.lastTimeOutId = setTimeout(function () {
            sendResponseIfPageNotLoaded(context);
        }, context.document.waitFor);
    }
}

async function checkPageExists(context, url, searchFor) {
    var isUrl = false;

    if (searchFor.substring(0, 3) === 'URL') {
        searchFor = searchFor.substring(4);
        isUrl = true;
    } else {
        searchFor = searchFor.substring(6);
    }

    context.tabExecution.selectedTabId = -1;

    var isFound = false;
    var windows = undefined;
    try {
        windows = await retrieveAllWindows();
        if (windows && windows.length > 0) {
            for (var i = 0; i < windows.length; i++) {
                for (var j = 0; j < windows[i].tabs.length; j++) {
                    if (isUrl) {
                        var currentUrl = removeSlash(windows[i].tabs[j].url);
                        searchFor = removeSlash(searchFor);

                        if (currentUrl === searchFor) {
                            isFound = true;
                            context.tabExecution.selectedTabId = windows[i].tabs[j].id;
                            break;
                        }
                    } else if (windows[i].tabs[j].title === searchFor) {
                        isFound = true;
                        context.tabExecution.selectedTabId = windows[i].tabs[j].id;
                        break;
                    }
                }
            }
        }
    } catch (e) {
        AALogger.error('ExtensionTabExecutor', 'checkPageExists', 'retrieveAllWindows', e.message);
        return;
    }

    if (!isFound) {
        var windowQuery = { url: url };
        var window = undefined;
        try {
            window = await createWindowWithUrl(windowQuery);
            context.tabExecution.selectedTabId = window.tabs[0].id;
            context.tabExecution.lastTimeOutId = setTimeout(function () {
                sendResponseIfPageNotLoaded(context);
            }, context.document.waitFor);
        } catch (e) {
            AALogger.error('script', 'ExtensionTabExecutor', 'checkPageExists', 'createWindowWithUrl', e);
            return;
        }
    } else {
        sendPageComplete(context);
    }
}

function removeSlash(url) {
    if (url.charAt(url.length - 1) === '/') {
        url = url.substring(0, url.length - 1);
    }

    return url;
}

async function newWindow(context, url) {
    AALogger.log('ExtensionTabExecutor', 'newWindow');
    var windowProperties = { url: url };
    var window = undefined;
    try {
        window = await createWindowWithUrl(windowProperties);
        context.tabExecution.selectedTabId = window.tabs[0].id;
        context.tabExecution.lastTimeOutId = setTimeout(function () {
            sendResponseIfPageNotLoaded(context);
        }, context.document.waitFor);
    } catch (e) {
        AALogger.warn('script', 'ExtensionTabExecutor', 'newWindow', e);
        return;
    }
}

async function newTab(context, url) {
    AALogger.log('ExtensionTabExecutor', 'newTab');
    var tabQuery = { url: url };
    var tab = undefined;
    try {
        tab = await createTab(tabQuery);
        context.tabExecution.selectedTabId = tab.id;
        context.tabExecution.lastTimeOutId = setTimeout(function () {
            sendResponseIfPageNotLoaded(context);
        }, context.document.waitFor);
    } catch (e) {
        AALogger.error('ExtensionTabExecutor', 'newTab', e.message);
        return;
    }
}

async function navigateURL(context, url) {
    AALogger.log('ExtensionTabExecutor', 'navigateURL');
    var windows = undefined;
    try {
        windows = await retrieveAllWindows();
        var tabId = windows[0].tabs[0].id;
    } catch (e) {
        AALogger.error('ExtensionTabExecutor', 'navigateURL', e.message);
        return;
    }

    var updateProperties = { url: url };
    try {
        await updateTab(tabId, updateProperties);
        context.tabExecution.selectedTabId = windows[0].tabs[0].id;
        context.tabExecution.lastTimeOutId = setTimeout(function () {
            sendResponseIfPageNotLoaded(context);
        }, context.document.waitFor);
    } catch (e) {
        AALogger.error('ExtensionTabExecutor', 'navigateURL', 'updateTab', e.message);
        return;
    }
}

async function close(tabId) {
    AALogger.log('ExtensionTabExecutor', 'close');
    ws.send('<AAOABResult Result=\'true\' Error=\'None\'></AAOABResult>');
    try {
        await removeTabById(tabId);
    } catch (e) {
        AALogger.error('ExtensionTabExecutor', 'close', e.message);
        return;
    }
}

function sendResponseIfPageNotLoaded(context) {
    if (context.tabExecution.isOpenURL === true && context.tabExecution.selectedTabId !== -1 && (context.tabExecution.lastTimeOutId !== null || context.tabExecution.lastTimeOutId !== 0)) {
        sendPageComplete(context);
        clearTimeout(context.tabExecution.lastTimeOutId);
    }
}

async function sendPageComplete(context) {
    AALogger.log('ExtensionTabExecutor', 'sendPageComplete');
    var tab = undefined;
    try {
        tab = await getTabById(context.tabExecution.selectedTabId);
        if (tab) {
            ws.send(`<AAOABResult Result='true' Error='None'><Vals><Val>${context.tabExecution.selectedTabId}</Val><Val>${new HTMLCommon(null).ReplaceSpacialCharacter(tab.title)}</Val></Vals></AAOABResult>`);
            context.tabExecution.isOpenURL = false;
            context.tabExecution.selectedTabId = -1;
        }
    } catch (e) {
        AALogger.error('ExtensionTabExecutor', 'sendPageComplete', e.message);
        return;
    }
}

// TODO: Confirm if we still support this WindowAvatar case
// var windowAvatarQueue = new WindowAvatarQueue();
// var isWindowAvatarSending = false;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (sender.tab) {
        if (request.type === 'AVATAR' && !String.IsNullOrEmpty(request.data)) {
            windowAvatarQueue.Enqueue(request.data);
        } else if (request.type === 'SET_FRAME_INDEX') {
            setIFrameIndex();
        } else if (request.type === 'DETECT_FRAMEWORK') {
            detectFramework(sender.tab.id);
        } else if (request.type === 'CSP_CHECK') {
            detectSecurityPolicyState(sender.tab.id);
        }
    }
});

function sendWindowAvatar() {
    var bufferSize = 6144;
    var sentBytes = 0;
    var avatar = String.Empty;

    function sendData() {
        if (!String.IsNullOrEmpty(avatar)) {
            if (sentBytes + bufferSize < avatar.length) {
                // ws.send(avatar.substring(sentBytes, sentBytes + bufferSize));
                sendContent(avatar.substring(sentBytes, sentBytes + bufferSize));
                sentBytes += bufferSize;
                setTimeout(sendData, 150);
            } else {
                // ws.send(avatar.substring(sentBytes));
                sendContent(avatar.substring(sentBytes));
                avatar = String.Empty;
                sentBytes = 0;
                sendNextWindowAvatarData();
            }
        }
    }

    function sendContent(data) {
        if (!String.IsNullOrEmpty(data)) {
            ws.send(data);
        }
    }

    function sendNextWindowAvatarData() {
        if (windowAvatarQueue.Count() > 0) {
            avatar = windowAvatarQueue.Dequeue();
            setTimeout(sendData, 150);
        } else {
            isWindowAvatarSending = false;
        }
    }

    sendNextWindowAvatarData();
}

function WindowAvatarQueue() {
    var list = [];
    this.IsAvatarQueueProcessed = false;

    this.Enqueue = function (item) {
        list.push(item);
        if (!isWindowAvatarSending) {
            isWindowAvatarSending = true;
            setTimeout(sendWindowAvatar, 150);
        }
    };

    this.Dequeue = function () {
        if (list.length <= 0) {
            return null;
        }

        var queueItem = list[0];
        list.splice(0, 1);

        return queueItem;
    };

    this.Count = function () {
        return list.length;
    };
};

async function setIFrameIndex() {
    var tab = undefined;
    var frames = undefined;
    try {
        tab = await getActiveTab();
        if (tab) {
            try {
                frames = await getAllFrames(tab.id);
                if (frames && frames.length > 0) {
                    for (var i = 0; i < frames.length; i++) {
                        if (frames[i].parentFrameId !== -1) {
                            chrome.tabs.sendMessage(tab.id, { 'frameId': frames[i].frameId }, { frameId: frames[i].frameId }, () => checkChromeError());
                        } else {
                            chrome.tabs.sendMessage(tab.id, { 'frameId': frames[i].parentFrameId }, { frameId: frames[i].frameId }, () => checkChromeError());
                        }
                    }
                } else {
                    return;
                }
            } catch (e) {
                AALogger.warn('script', 'setIFrameIndex', 'getAllFrames', e);
                return;
            }
        } else {
            return;
        }
    } catch (e) {
        AALogger.error('ExtensionTabExecutor', 'setIFrameIndex', e.message);
        return;
    }
}

function detectFramework(tabId) {
    AALogger.log('ExtensionTabExecutor', 'detectFramework');
    chrome.tabs.sendMessage(tabId, { checkDocumentReadyState: true }, function (pageStatus) {
        checkChromeError();
        if (pageStatus && pageStatus === HTMLDocumentStatus.COMPLETE) {
            AALogger.log('ExtensionTabExecutor', 'page is ready for js injection');
            chrome.tabs.sendMessage(tabId, { securityPolicyStatusRequest: true }, function (response) {
                if (response.securityPolicyStatusResponse == true) {
                    AALogger.log('ExtensionTabExecutor', 'csp policy detected');
                    var scriptText = getDetectFrameworkScript();
                    var wrapperCode = javascriptCodeWrapper(scriptText, '_AAEventForPageFramework', 'detectFrameworkResponse');
                    var request = {
                        tabId: tabId,
                        debuggerAction: 'executeUserJS',
                        commandData: wrapperCode
                    };

                    executeDebuggerCommand(undefined, request, (res) => {
                        AALogger.log('ExtensionTabExecutor', 'done executing with debugger');
                    })
                } else {
                    AALogger.log('ExtensionTabExecutor', 'no csp policy in page');
                    var scriptText = getDetectFrameworkScript();
                    var wrapperCode = javascriptCodeWrapper(scriptText, '_AAEventForPageFramework', 'detectFrameworkResponse');
                    chromeExecuteScript({ tabId: tabId }, wrapperCode, '_AAEventForPageFramework')
                }
            })
        } else {
            setTimeout(detectFramework, 1000, tabId);
        }
    });
}

function getDetectFrameworkScript() {
    return '(function() {' +
        ' var ret = { detail: { workday: (typeof window.workday !== \'undefined\'), salesforce: (typeof window.Sfdc !== \'undefined\'), sapfiori: (typeof window.sap !== \'undefined\')  }};' +
        ' return ret;' +
        '})();';
}

function detectSecurityPolicyState(tabId) {
    AALogger.log('ExtensionTabExecutor', 'detectSecurityPolicyState');
    var scriptText = '(function() {' +
        ' var ret = { detail: \'CSP Check\' };' +
        ' return ret;' +
        '})();';

    var wrapperCode = javascriptCodeWrapper(scriptText, 'automationanywhere-recorder-securitypolicychecker', 'cspcheckresponse');
    chromeExecuteScript({ tabId: tabId }, wrapperCode, 'automationanywhere-recorder-securitypolicychecker')
}

function checkChromeError() {
    if (chrome.runtime.lastError) {
        AALogger.log('ExtensionTabExecutor', 'checkChromeError', 'chrome last error note', chrome.runtime.lastError);
    }
}
