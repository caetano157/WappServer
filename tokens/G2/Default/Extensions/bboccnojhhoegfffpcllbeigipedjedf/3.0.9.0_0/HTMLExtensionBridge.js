var i = new Array;
var IframeIndexinfo = new Map();
var frameIndex;
var SETFRAMEINDEX = "SetFrameIndex";
var GETFRAMEINDEX = "GetFrameIndex";
var CrossDomainIframeInfo = {
    "RequestMethod": undefined,
    "Framedomxpath": undefined,
    "FrameIndex": undefined
}
var securityPolicyViolationState;
var securityPolicyEventData;

function injectJavascript() {
    var s = document.createElement('script');
    s.src = chrome.runtime.getURL('HTMLAlertWrapper.js');
    s.onload = function() {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(s);
}


function extensionOnMessageListener(request, sender, sendResponse) {
    AALogger.log("script", "onMessage: ", request);
    if (request.checkDocumentReadyState) {
        sendResponse(document.readyState);
    } else if(request && request.command && request.command.waitForDocumentStatus){
        return handleWaitForDocumentStatusMessage(request, sendResponse);
    } else if (request.framerequest) {
        return handleFrameRequestMessage(request, sendResponse);
    } else if (request.crossdomainframe) {
        return handleCrossDomainFrameMessage(request, sendResponse);
    } else if (request.mapperXML) {
        ObjectMapper.InitializeMapperDictionary(request.mapperXML);
    }  else if (request.extractSource) {
        return handleExtractSourceMessage(request, sendResponse);
    } else if (request.frameId) {
        return handleFrameIdMessage(request);
    } else if (request.getFrameId) {
        return handleGetFrameIdMessage(request, sendResponse);
    } else if (request.securityPolicyStatusRequest) {
        return handleSecurityPolicyStatusMessage(request, sendResponse);
    } else if (request.method) {
        return handleBridgeActionMessage(request, sendResponse);
    } else {
        AALogger.warn('script', "onMessage: ", "Unhandled case");
    }
}


function handleWaitForDocumentStatusMessage(request, sendResponse) {
    var res = executeBrowserAction(request.command);
    if (res != undefined) {
        sendResponse(res);
    }
}


function handleFrameRequestMessage(request, sendResponse) {
    var currentDocument = document;
    var frames = currentDocument.getElementsByTagName('frame');
    var match = false;
    var frameWanted = undefined;

    for (var i = 0; i < frames.length; i++) {
        var selectionCriteria = request.framerequest;

        var frameCriteriaMap = generateElementMap(frames[i], selectionCriteria)

        for (let selectionCriteriaKey in selectionCriteria) {
            if (frameCriteriaMap[selectionCriteriaKey] !== undefined || frameCriteriaMap[selectionCriteriaKey] === '') {
                if (frameCriteriaMap[selectionCriteriaKey] === selectionCriteria[selectionCriteriaKey].value.string) {
                    match = true;
                } else {
                    match = false;
                    // it is not a match, move onto the next frame
                    break;
                }
            } else {
                // move onto the next criteria key
                continue;
            }
        }

        if (match === true) {
            var input = {
                frameWanted: frames[i]
            }

            try {
                var res = executeBrowserAction(input);
                if (res === 'Action cannot be performed without DOMXPath on Cross Domain Frame') {
                    sendResponse({ errorResult: 'Action cannot be performed without DOMXPath on Cross Domain Frame' });
                }
                if (res != undefined) {
                    sendResponse({ result: res });
                }
            } catch (e) {
                sendResponse({ errorResult: e.message });
            }
        }

        if (i == (frames.length - 1) && !match) {
            sendResponse({ errorResult: 'Action cannot be performed' });
        }
    }
}


function handleCrossDomainFrameMessage(request, sendResponse) {
    if (request.crossdomainframe.extract) {
        try {
            var res = executeBrowserAction(request.crossdomainframe);
            if (res === 'Action cannot be performed') {
                sendResponse({ errorResult: 'Action cannot be performed' });
            }
            if (res != undefined) {
                sendResponse({ result: res });
            }
        } catch (e) {
            sendResponse({ errorResult: e.message });
        }
    }
}


function handleFrameIdMessage(request) {
    if (request.frameId != -1) {
        frameIndex = request.frameId;
        AALogger.log("script",frameIndex);
    }
    IframeIndexinfo.clear();
}


function handleGetFrameIdMessage(request, sendResponse) {
    if (hasMatchingCriteria(request.domxpath, request.getFrameId.executeJavaScript.browserTab.browserControl.selectionCriteria)) {
        var index = getIFrameIndex(request.domxpath);
        if (index == undefined) {
            try {
                CrossDomainIframeInfo.RequestMethod = GETFRAMEINDEX;
                CrossDomainIframeInfo.Framedomxpath = request.domxpath;
                var iframe_jsondata = JSON.stringify(CrossDomainIframeInfo);
                document.contentWindow.postMessage(iframe_jsondata, '*');
                index = getIFrameIndex(request.domxpath);
                var res = { frameId: index, orgRequest: request.getFrameId.executeJavaScript };
                sendResponse(res);
            } catch (e) {
                AALogger.log("script", e);
            }
        } else {
            var res = { frameId: index, orgRequest: request.getFrameId.executeJavaScript };
            sendResponse(res);
        }
    }
}


function handleExtractSourceMessage(request, sendResponse) {
    if (request.extractSource.retry) {
        if (CrossDomainIframeInfo.FrameIndex != undefined) {
            sendResponse({ result: CrossDomainIframeInfo.FrameIndex });
        }
    } else {
        try {
            var res = executeBrowserAction(request.extractSource);

            if (res === 'Invalid request') {
                sendResponse({ errorResult: 'Invalid request' });
            }

            if (res === 'Action cannot be performed') {
                sendResponse({ errorResult: 'Action cannot be performed' });
            }

            if (res != undefined) {
                sendResponse({ result: res });
            }
        } catch (e) {
            AALogger.info('script',"handleExtractSourceMessage error: ", e);
            sendResponse({ errorResult: e });
        }
    }
}


function handleSecurityPolicyStatusMessage(request, sendResponse) {
    sendResponse({
        securityPolicyStatusResponse: securityPolicyViolationState,
        securityPolicyEventData: securityPolicyEventData,
        request: request.securityPolicyStatusRequest
    });
}


function handleBridgeActionMessage(request, sendResponse) {
    AALogger.info("script","handleBridgeActionMessage:", request);
    var responseSent = false;
    // should only inject if it's a play request or search object request
    // alert case within play scenario
    var inject = request.method.indexOf(HTMlRequestAction.PLAY_OBJECT_ACTION) > 0 || request.method.indexOf(HTMlRequestAction.SEARCH_OBJECT) > 0;
    if (inject) {
        temporaryAlertListener = function (event) {
            if (!responseSent) {
                responseSent = true;
                sendResponse({ data: "<AAOABResult Result='true' Error='None'> <Table></Table></AAOABResult>" });
            }
        };
        window.addEventListener("automationanywhere-recorder-alert", temporaryAlertListener);
        injectJavascript();
    }

    var res = ExecuteBridgeAction(request.method, request.browser, sendResponse);
    if (!responseSent) {
        responseSent = true;
        sendResponse({ data: res });
    }

    if (inject && temporaryAlertListener) {
        window.removeEventListener("automationanywhere-recorder-alert", temporaryAlertListener);
    }
}


function hasMatchingCriteria(xpath, selectionCriteria) {
    try {
        var match = false;
        var frameObj = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        var frameCriteriaMap = generateElementMap(frameObj, selectionCriteria);
        for (let selectionCriteriaKey in selectionCriteria) {
            if (frameCriteriaMap[selectionCriteriaKey] !== undefined || frameCriteriaMap[selectionCriteriaKey] === '') {
                if (frameCriteriaMap[selectionCriteriaKey] === selectionCriteria[selectionCriteriaKey].value.string) {
                    match = true;
                } else {
                    match = false;
                    // it is not a match, move onto the next frame
                    break;
                }
            } else {
                // move onto the next criteria key
                continue;
            }
        }
    } catch (e) {
        AALogger.log("script", e);
    }
    return match;
}

function getIFrameIndex(frameDomXPath) {
    if (IframeIndexinfo.has(frameDomXPath)) {
        return IframeIndexinfo.get(frameDomXPath);
    }

    return undefined;
}

function handleMessage(e) {
    if (typeof e.data == 'string' && e.data.includes(GETFRAMEINDEX) && frameIndex != undefined) {
        var frameInformation = JSON.parse(e.data);
        if (frameInformation != undefined) {
            frameInformation.RequestMethod = SETFRAMEINDEX;
            frameInformation.FrameIndex = frameIndex;
            var frameData = JSON.stringify(frameInformation);
            window.parent.postMessage(frameData, '*');
        }
    }
    if (typeof e.data == 'string' && e.data.includes(SETFRAMEINDEX)) {
        var frameInformation = JSON.parse(e.data);
        if (frameInformation != undefined) {
            if (!IframeIndexinfo.has(frameInformation.Framedomxpath) && frameInformation.FrameIndex != undefined) {
                IframeIndexinfo.set(frameInformation.Framedomxpath, frameInformation.FrameIndex);
            }
        }
    }
}

function checkChromeError() {
    if (chrome.runtime.lastError) {
       AALogger.log('script', 'chrome last error note', chrome.runtime.lastError);
       }
}
