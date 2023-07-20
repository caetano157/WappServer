//Copyright (c) 2020 Automation Anywhere.
// All rights reserved.
//
// This software is the proprietary information of Automation Anywhere.
//You shall use it only in accordance with the terms of the license agreement
//you entered into with Automation Anywhere.
var times = 0;

function executeBrowserAction(request) {
     if (request.frameWanted) {
        return extractPageSourceFromFrame(request.frameWanted);
    } else if (request === 'basic_extract_source') {
        return basicExtractDocumentSource();
    } else if (isFrameControlTypeExtractSource(request)) {
        return extractSourceByXPath(request.extractSource.browserTab.browserControl.selectionCriteria)
    } else if (request.extractSource || request.extract) {
        return basicExtractDocumentSource();
    } else if (request.waitForDocumentStatus) {
        return timerFunctionToGetDocumentStatus(request.waitForDocumentStatus.documentStatus.toLowerCase(), request.timeOutMs);
    } else {
        throw "Invalid request";
    }
}

function timerFunctionToGetDocumentStatus(documentStatus, numberOfIteration) {
    var documentStatusCounter = numberOfIteration - 1000;
    if (documentStatus === document.readyState) {
        return { status: true, pagestatus: document.readyState };
    }
    if (documentStatusCounter <= 0) {
        return { status: false, pagestatus: HTMLDocumentStatus.UNKNOWN };
    } else {
        setTimeout(timerFunctionToGetDocumentStatus, 1000, documentStatus, documentStatusCounter);
    }
}

function basicExtractDocumentSource() {
    return document.documentElement.outerHTML;
}

function extractPageSourceFromFrame(frame) {
    var outerHtml = undefined;
    try {
        outerHtml = frame.contentWindow.document.body.outerHTML;
    } catch (e) {
        if (e.message.includes('Blocked a frame with origin')) {
            return 'Action cannot be performed without DOMXPath on Cross Domain Frame'
        }
    }
    return outerHtml;
}

function extractSourceByXPath(selectionCriteria) {
    var frameObj = undefined;
    var frameOuterHtml = undefined;
    var match = false;

    try {
        // Happy path: standard same-domain iframe
        frameObj = document.evaluate(selectionCriteria.DOMXPath.value.string, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        frameOuterHtml = frameObj.contentWindow.document.body.outerHTML;

        // check criteria
        var frameCriteriaMap = generateElementMap(frameObj, selectionCriteria);
        for (let selectionCriteriaKey in selectionCriteria) {
            if (frameCriteriaMap[selectionCriteriaKey] !== undefined) {
                if (frameCriteriaMap[selectionCriteriaKey] === selectionCriteria[selectionCriteriaKey].value.string) {
                    match = true;
                } else {
                    match = false;
                    // it is not a match, move onto the next frame
                    break;
                }
            } else {
                // move onto the next criteria key - skipping
                continue;
            }
        }

        if (match === false) {
            return 'Action cannot be performed'
        }

    } catch (e) {
        if (e.message.includes('Blocked a frame with origin')) {
            // Logic to handle Cross Domain iframes
            AALogger.log('browserAction', 'extractSourceByXPath error: ' + e.message);
            CrossDomainIframeInfo.RequestMethod = GETFRAMEINDEX;
            CrossDomainIframeInfo.Framedomxpath = selectionCriteria.DOMXPath.value.string;
            var iframe_jsondata = JSON.stringify(CrossDomainIframeInfo);
            if (times == 0) {
                frameObj.contentWindow.postMessage(iframe_jsondata, "*");
            }
            times++;
            var res = waitForFrameIndex();
            return res;
        }
    }

    return frameOuterHtml;
}

function isFrameControlTypeExtractSource(request) {
    if (request.extractSource && request.extractSource.browserTab &&
        request.extractSource.browserTab.browserControl &&
        request.extractSource.browserTab.browserControl.uiobjectControlType) {
        if (request.extractSource.browserTab.browserControl.uiobjectControlType === 'IFRAME') {
            return true;
        }
    }
    return false;
}

function waitForFrameIndex() {
    var iFrameIndex = getIFrameIndex(CrossDomainIframeInfo.Framedomxpath);
    if (iFrameIndex != undefined) {
        CrossDomainIframeInfo.FrameIndex = iFrameIndex;
        times = 0;
        return CrossDomainIframeInfo.FrameIndex;
    } else {
        setTimeout(waitForFrameIndex, 2000);
    }
}
