//Copyright (c) 2020 Automation Anywhere.
// All rights reserved.
// This software is the proprietary information of Automation Anywhere.
// You shall use it only in accordance with the terms of the license agreement
// you entered into with Automation Anywhere.


function ExecuteBridgeAction(inputString, browser, sendResponse) {
    try {
        if(inputString== HTMlRequestAction.APPLETRECT)
            return appletRect(browser);

        var requestObj = new RequestDataParser(inputString);
        requestObj.ParseXMLString();
        var eResult = new HTMLResult();

        var ObjPlayWait = requestObj.PlayWait;
        if (ObjPlayWait == 0)
            ObjPlayWait = 15;

        if ((HTMLCommon.GetBrowserName() == HTMLBrowsers.Chrome) || (HTMLCommon.GetBrowserName() == HTMLBrowsers.Firefox)) {
            if (!requestObj.IsCrossDomainRequest) {
                if (requestObj.PluginObject.IsDefaultDPI == "True" || requestObj.PluginObject.IsDefaultDPI == "true") {
                    requestObj.ParentPoint[0] = Math.round(window.outerWidth - (window.innerWidth * window.devicePixelRatio));
                    requestObj.ParentPoint[1] = Math.round(window.outerHeight - (window.innerHeight * window.devicePixelRatio));
                } else {
                    requestObj.ParentPoint[0] = 0;
                    requestObj.ParentPoint[1] = 0;
                }
            } else {
                if (requestObj.RequestAction == HTMlRequestAction.PLAY_OBJECT_ACTION && requestObj.ActionData.Action == HTMLControlAction.GetProperty) {
                    if (requestObj.PluginObject.IsDefaultDPI.toLowerCase() === "true") {
                        requestObj.ParentPoint[0] = Math.round(window.outerWidth - (window.innerWidth * window.devicePixelRatio));
                        requestObj.ParentPoint[1] = Math.round(window.outerHeight - (window.innerHeight * window.devicePixelRatio));
                    } else {
                        requestObj.ParentPoint[0] = 0;
                        requestObj.ParentPoint[1] = 0;
                    }
                }
            }
        }

        var res =  executeCommand(requestObj, eResult, browser, sendResponse);
        return res;
    }
    catch (e) {
        AALogger.log('bridgeAction', 'ExecuteBridgeAction', e.message);
        return new HTMLResult().GetResultString();
    }
}
function appletRect(browser){
    var objDocument;

    if (Browser.type === HTMLBrowsers.Firefox) {
        objDocument = content.document;
    } else {
        objDocument = document;
    }

    _HTMLDoc = objDocument;
    var appletElemnt = objDocument.getElementsByTagName('applet')[0];
    if (appletElemnt ) {
        var rect = appletElemnt.getBoundingClientRect();
        var elementTop = parseInt(rect.top);
        var elementLeft = parseInt(rect.left);
        var elementHeight = parseInt(rect.bottom - rect.top);
        var elementWidth = parseInt(rect.right - rect.left);
        setFocus(appletElemnt, null);
        return "APPLETRECT:"+elementLeft.toString()+"|"+elementTop.toString()+"|"+elementWidth.toString()+"|"+elementHeight.toString();
    }
}

function executeCommand(requestObj, eResult, browser, sendResponse) {
    var outPutString;
    switch (requestObj.RequestAction) {
        case HTMlRequestAction.PLAY_OBJECT_ACTION:
        {
            var SearchObject = new HtmlObjectSearch(requestObj.ParentPoint);
            if (requestObj.FrameDOMXPath) {
                _HTMLDoc = document;
                var iframedata = SearchObject.CrossDomainFrameSearch(requestObj.ObjectToSearch, browser, requestObj.FrameDOMXPath, HTMlRequestAction.PLAY_OBJECT_ACTION);
                if (iframedata == CROSSDOMAIN_IFRAME_NOTAVAILABLE) {
                    eResult.IsSuccess = false;
                    eResult.ErrorCode = HTMLErrorCode.NullObject;
                    outPutString = eResult.GetResultString();
                    break;
                }
                outPutString = eResult.GetCrossDomainPlayRequestString(iframedata, requestObj.RequestAction);
                break;
            }
            var htmlElement = SearchObject.Search(requestObj.ObjectToSearch, requestObj.SearchCriteria, requestObj.PlayWait, browser, requestObj.FrameInfo, requestObj.ActionData.CaptureVersion);
            if (htmlElement == null || htmlElement.toString().toLowerCase().indexOf("htmlhtmlelement")!=-1 || htmlElement.toString().toLowerCase().indexOf("htmldocument")!=-1)  {
                eResult.IsSuccess = false;
                eResult.ErrorCode = HTMLErrorCode.NullObject;
            } else {
                setFocus(htmlElement, requestObj.ParentPoint);

                if(requestObj.ActionData.Value1 == HTMLPropertyEnum.IEFrameName ) {
                    eResult.AddValue(SearchObject.FrameInfo.FrameName);
                    eResult.IsSuccess = true;
                } else if(requestObj.ActionData.Value1 == HTMLPropertyEnum.IEFrameSrc ) {
                    eResult.AddValue(SearchObject.FrameInfo.FrameSrc);
                    eResult.IsSuccess = true;
                } else {
                    var Executor = new HTMLExecutor(htmlElement, requestObj);
                    var isElementInFrame = SearchObject.FrameInfo.Frame !== null;
                    eResult = Executor.Execute(isElementInFrame);
                }
            }

            outPutString = eResult.GetResultString();
            break;
        }

        case HTMlRequestAction.SEARCH_OBJECT: {
            try {
                var SearchObject = new HtmlObjectSearch(requestObj.ParentPoint);
                if (requestObj.FrameDOMXPath) {
                    _HTMLDoc = document;
                    var iframedata = SearchObject.CrossDomainFrameSearch(requestObj.ObjectToSearch, browser, requestObj.FrameDOMXPath, HTMlRequestAction.SEARCH_OBJECT);
                    if (iframedata == CROSSDOMAIN_IFRAME_NOTAVAILABLE) {
                        eResult.IsSuccess = false;
                        eResult.ErrorCode = HTMLErrorCode.NullObject;
                        outPutString = eResult.GetResultString();
                        break;
                    }
                    outPutString = eResult.GetCrossDomainPlayRequestString(iframedata, requestObj.RequestAction);
                    return outPutString;
                }
                var htmlElement = SearchObject.Search(requestObj.ObjectToSearch, requestObj.SearchCriteria, requestObj.PlayWait, browser, requestObj.FrameInfo, requestObj.ActionData.CaptureVersion);
                var htmNode = null;
                var common = new HTMLCommon(htmlElement);
                if (htmlElement != null) {
                    setFocus(htmlElement, requestObj.ParentPoint);
                    htmNode = common.GetHTMLObjectNode(requestObj.ParentPoint, htmlElement, HTMlRequestAction.SEARCH_OBJECT, SearchObject.FrameInfo);
                    if (HTMLCommon.GetBrowserName() == HTMLBrowsers.Chrome) {
                        htmNode.objNode.Left +=Math.round(SearchObject.SearchedFrameLocation[0] * window.devicePixelRatio);
                        htmNode.objNode.Top += Math.round(SearchObject.SearchedFrameLocation[1] * window.devicePixelRatio);

                        if (requestObj.PluginObject.IsDefaultDPI == "True") {
                            var screenLeft = window.screenLeft < 2 ? window.screenLeft : window.screenLeft - 8;
                            var screenTop = window.screenTop < 2 ? window.screenTop : window.screenTop - 8;
                            htmNode.objNode.Left = htmNode.objNode.Left + screenLeft;
                            htmNode.objNode.Top = htmNode.objNode.Top  + screenTop;
                        }
                    } else {
                        htmNode.objNode.Left += SearchObject.SearchedFrameLocation[0];
                        htmNode.objNode.Top += SearchObject.SearchedFrameLocation[1];

                        }

                        htmNode.objNode.Left = parseInt(htmNode.objNode.Left);
                        htmNode.objNode.Top = parseInt(htmNode.objNode.Top);
                        outPutString = htmNode.ToString();
                    } else {
                        htmNode = common.GetHTMLObjectNode(requestObj.ParentPoint, null, HTMlRequestAction.SEARCH_OBJECT, SearchObject.FrameInfo);
                    }
                }
                catch (e) {
                    htmNode = common.GetHTMLObjectNode(requestObj.ParentPoint, null, HTMlRequestAction.SEARCH_OBJECT, SearchObject.FrameInfo);
                }
                return htmNode.ToString();
            }
        case HTMlRequestAction.DETECT_OBJECT_NODE:
        case HTMlRequestAction.CAPTURE_OBJECT_NODE: {
            var htmlRecorder = new HTMLRecorder();
            htmlRecorder.BrowserName = browser;
            outPutString = htmlRecorder.GetObjectNodeFromPoint(requestObj);
            break;
        }
        case HTMlRequestAction.CREATE_AVATAR: {
            var htmlObjectTree = GetWindowAvatar(requestObj.ParentPoint, browser, requestObj.CaptureHiddenObjects, requestObj.IsVisibleSupported);//new HTMLWindowAvatar(requestObj.ParentPoint);
            windowAvatarStringNotifier = new WindowAvatarStringNotifier(6144);
            outPutString = htmlObjectTree.Create(sendAvatarData);
            break;
        }
    }
    outPutString = removeXMLInvalidChars(outPutString, true);
    return  outPutString;
}

function removeXMLInvalidChars(str, removeDiscouragedChars) {
    // remove everything discouraged by XML 1.0 specifications
    var regex = /((?:[\0-\x08\x0B\f\x0E-\x1F\uFFFD\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/g;
    str = String(str || '').replace(regex, '');
    if (removeDiscouragedChars) {
        regex = new RegExp(
            '([\\x7F-\\x84]|[\\x86-\\x9F]|[\\uFDD0-\\uFDEF]|(?:\\uD83F[\\uDFFE\\uDFFF])|(?:\\uD87F[\\uDF' +
            'FE\\uDFFF])|(?:\\uD8BF[\\uDFFE\\uDFFF])|(?:\\uD8FF[\\uDFFE\\uDFFF])|(?:\\uD93F[\\uDFFE\\uD' +
            'FFF])|(?:\\uD97F[\\uDFFE\\uDFFF])|(?:\\uD9BF[\\uDFFE\\uDFFF])|(?:\\uD9FF[\\uDFFE\\uDFFF])' +
            '|(?:\\uDA3F[\\uDFFE\\uDFFF])|(?:\\uDA7F[\\uDFFE\\uDFFF])|(?:\\uDABF[\\uDFFE\\uDFFF])|(?:\\' +
            'uDAFF[\\uDFFE\\uDFFF])|(?:\\uDB3F[\\uDFFE\\uDFFF])|(?:\\uDB7F[\\uDFFE\\uDFFF])|(?:\\uDBBF' +
            '[\\uDFFE\\uDFFF])|(?:\\uDBFF[\\uDFFE\\uDFFF])(?:[\\0-\\t\\x0B\\f\\x0E-\\u2027\\u202A-\\uD7FF\\' +
            'uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|' +
            '(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF]))', 'g');

        str = str.replace(regex, '');
    }
    return str;
}

var windowAvatarStringNotifier;

function sendAvatarData(xmlData, isEndOfData) {
    windowAvatarStringNotifier.AppendAndNotify(xmlData);
    if (isEndOfData) {
        windowAvatarStringNotifier.SendFinalData();
    }
}

function WindowAvatarStringNotifier(bufferSize){

    var _bufferSize = bufferSize;
    var _currentContent = String.Empty;
    var AVATAR_STRING = "AVATAR";

    this.AppendAndNotify = function(content){
        if ((_currentContent.length + content.length) < _bufferSize){
            _currentContent = _currentContent + content;
        }
        else {
            var windowAvatarString = String.Empty;

            if ((_currentContent.length + content.length) == _bufferSize) {
                windowAvatarString = _currentContent + content;
                _currentContent = String.Empty;
            } else {
                var splitIndex = _bufferSize - _currentContent.length;
                windowAvatarString = _currentContent + content.substring(0, splitIndex);
                _currentContent = content.substring(splitIndex);
            }

            chrome.runtime.sendMessage({ data: windowAvatarString, type: AVATAR_STRING });
        }
    }

    this.SendFinalData = function () {
        if (!String.IsNullOrEmpty(_currentContent)) {
            chrome.runtime.sendMessage({ data: _currentContent, type: AVATAR_STRING }, () => checkChromeError());
            _currentContent = String.Empty;
        }
    }
};

function setFocus(htmlElement, DOMLocation) {
    try {
        if (htmlElement.focus != null && htmlElement.focus != 'undefined') {
            htmlElement.focus();
        }
    } catch (e) {
        AALogger.log('bridgeAction', 'setFocus', e.message);
    }

    try {
        var elementTop, elementLeft, elementHeight, elementWidth;

        try {
            var rect = htmlElement.getBoundingClientRect();
            elementTop = parseInt(rect.top);
            elementLeft = parseInt(rect.left);
            elementHeight = parseInt(rect.bottom - rect.top);
            elementWidth = parseInt(rect.right - rect.left);
        }
        catch (e) {
            AALogger.log('bridgeAction', 'setFocus', e.message);
            var common = new HTMLCommon(htmlElement);
            elementTop = parseInt(common.GetHTMLIETop(0, true));
            elementLeft = parseInt(common.GetHTMLIELeft(0, true));
            elementHeight = parseInt(common.GetHTMLHeight());
            elementWidth = parseInt(common.GetHTMLWidth());
        }

        var ownerDoc = null;

        if (_HTMLDoc.clientLeft == undefined) {
            ownerDoc = _HTMLDoc.documentElement;
        } else {
            ownerDoc = _HTMLDoc;
        }

        if (((elementLeft + elementWidth) > ownerDoc.clientWidth) || ((elementTop + elementHeight) > ownerDoc.clientHeight) || elementLeft < 0 || elementTop < 0) {
            htmlElement.scrollIntoView();
        }
    } catch (e) {
        AALogger.log('bridgeAction', 'executeCommand', e.message);
    }
}

function SetAccessibitySettings(version) {
    AccessibilitySettings.SearchVersion = xPathDetectionVersion.JavaScriptDOMXPath;
    AALogger.log('bridgeAction', 'SetAccessibitySettings', "Version : " + AccessibilitySettings.SearchVersion);
}
"";
