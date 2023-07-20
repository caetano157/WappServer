
// Copyright (c) 2019 Automation Anywhere.
// All rights reserved.
//
// This software is the proprietary information of Automation Anywhere.
// You shall use it only in accordance with the terms of the license agreement
// you entered into with Automation Anywhere.


function HtmlObjectSearch(DOMLocation) {
    var myElement;
    var _htmlDocArray;
    var isFrameScroll = false;
    this.SearchedFrameLocation = null;
    this.FrameInfo = null;
    var CurrentBrowser = String.Empty;
    var CaptureVersion = "1";

    this.Search = function (ObjHtml, searchCriteria, ObjPlayWait, browser, frameInfo, captureVersion) {
        try {
            if (ObjHtml != null) {
                CurrentBrowser = browser;
                CaptureVersion = captureVersion;
                this.FrameInfo = findFrame(browser, frameInfo, searchCriteria);
                var isNewerCaptureVersion = isNewerRecorderCaptureVersion(captureVersion);
                if (this.FrameInfo != null) {
                    AALogger.log('HtmlObjectSearch', 'element is in frame');
                    _HTMLDoc = this.FrameInfo.ContentDocument;
                    var currentDocument = _HTMLDoc.ownerDocument == null ? _HTMLDoc : _HTMLDoc.ownerDocument;
                    if (findElement(ObjHtml, searchCriteria) != null) {
                        this.SearchedFrameLocation = this.FrameInfo.FrameLocation;
                        if (isNewerCaptureVersion) {
                            if (!isVisible(myElement, currentDocument)) {
                                AALogger.log('HtmlObjectSearch', 'element is not visible in frame');
                                scrollToElementCenter(myElement, currentDocument, this.FrameInfo.Frame);
                            }
                        } else {
                            AALogger.log('HtmlObjectSearch', 'scrollIntoView', 'capture version', captureVersion);
                            scrollIntoView(myElement);
                        }
                        return myElement;
                    }
                }

                for (index = 0; index < _htmlDocArray.length; index++) {
                    _HTMLDoc = _htmlDocArray[index].ContentDocument;
                    if (findElement(ObjHtml, searchCriteria) != null) {
                        this.FrameInfo = _htmlDocArray[index];
                        this.SearchedFrameLocation = _htmlDocArray[index].FrameLocation;
                        if (isNewerCaptureVersion) {
                            if (!isVisible(myElement, _HTMLDoc)) {
                                // if not frame, scroll with offset
                                scrollWithYOffset(myElement, true);
                            }
                        } else {
                            AALogger.log('HtmlObjectSearch', 'scrollIntoView', 'capture version', captureVersion);
                            scrollIntoView(myElement);
                        }
                        return myElement;
                    }
                }
                return null;
            }
        } catch (e) {
            AALogger.error('HTMLObjectSearch', 'Search', e.message);
            return null;
        }
    }

    function scrollToElementCenter(element, currentDocument, frameDocument) {
        AALogger.log('HTMLObjectSearch', 'scrollToElementCenter', element)
        var box = element.getBoundingClientRect()
        var xCenter = (box.left + box.right) / 2;
        var yCenter = (box.top + box.bottom) / 2;
        element.scrollTo(xCenter, yCenter);
        if (!isInViewBox(element, currentDocument)) {
            AALogger.warn('HTMLObjectSearch', 'scrollToElementCenter', 'retrying scroll with offset information');
            scrollWithYOffset(element, false);
            if (!isInViewBox(element, currentDocument)) {
                AALogger.warn('HTMLObjectSearch', 'scrollToElementCenter', 'retrying scroll with offset information with frame document');
                scrollWithYOffset(element, false, frameDocument);
                if (!isInViewBox(element, currentDocument)) {
                    AALogger.warn('HTMLObjectSearch', 'scrollToElementCenter', 'retrying scroll with scrollIntoView');
                    scrollIntoView(element);
                }
            }
        }
    }

    function isNewerRecorderCaptureVersion(captureVersion) {
        return captureVersion !== null && captureVersion !== undefined && captureVersion >= 2800;
    }

    function isVisible(element, currentDocument) {
        if (!isInViewBox(element, currentDocument)) {
            return false;
        }

        var elementsEqual = getElementFromPoint(element, currentDocument) === element
        AALogger.log('HTMLObjectSearch', 'elementsEqual', getElementFromPoint(element, currentDocument) === element)
        var corners = getCorners(element, currentDocument);

        if (!isElementCornerVisible(corners.leftTop, element) || !isElementCornerVisible(corners.rightTop, element) || !isElementCornerVisible(corners.leftBottom, element) || !isElementCornerVisible(corners.rightBottom, element)) {
            AALogger.log('HTMLObjectSearch', 'isVisible', 'element is partially blocked by a different element');
            return false;
        }

        AALogger.log('HTMLObjectSearch', 'isVisible', 'element fully visible');
        return elementsEqual;
    }

    function isElementCornerVisible(elementPoint, elementToMatch) {
        if (elementPoint !== null && elementPoint.children !== null && elementPoint.children.length > 0) {
            for (var i = 0; i < elementPoint.children.length; i++) {
                if (elementPoint.children[i] === elementToMatch) {
                    AALogger.log('HTMLObjectSearch', 'isElementCornerVisible','found element in child');
                    return true;
                }
            }
        }

        if (elementPoint === elementToMatch) {
            return true;
        }

        AALogger.log('HTMLObjectSearch', 'isElementCornerVisible','element not found in children');
        return false;
    }

    // returns element point obtained from x,y centers
    function getElementFromPoint(element, currentDocument) {
        var box = element.getBoundingClientRect()
        var xCenter = (box.left + box.right) / 2;
        var yCenter = (box.top + box.bottom) / 2;
        var elementFromPoint = undefined;
        try {
            elementFromPoint = currentDocument.elementFromPoint(xCenter, yCenter);
        } catch (e) {
            AALogger.error('HTMLObjectSearch', 'getElementFromPoint', e.message);
        }
        AALogger.log('HTMLObjectSearch', 'getElementFromPoint', element);
        return elementFromPoint;
    }

    function isInViewBox(element, currentDocument) {
        var corners = getCorners(element, currentDocument);
        if (corners.leftTop === null && corners.rightTop === null && corners.leftBottom === null && corners.rightBottom === null) {
            AALogger.log('HTMLObjectSearch', 'isInViewBox', 'element not in view box');
            return false;
        }

        return true;
    }

    function getCorners(element, currentDocument) {
        var boundingRect = element.getBoundingClientRect()
        var leftTop = currentDocument.elementFromPoint(boundingRect.left + 1, boundingRect.top + 1);
        var rightTop = currentDocument.elementFromPoint(boundingRect.right - 1, boundingRect.top + 1);
        var leftBottom = currentDocument.elementFromPoint(boundingRect.left + 1, boundingRect.bottom - 1);
        var rightBottom = currentDocument.elementFromPoint(boundingRect.right - 1, boundingRect.bottom - 1);
        return {
            leftTop: leftTop,
            rightTop: rightTop,
            leftBottom: leftBottom,
            rightBottom: rightBottom
        }
    }

    function scrollIntoView(element) {
        AALogger.log('HTMLObjectSearch', 'scrollIntoView', element);
        try {
            element.scrollIntoView();
        }
        catch (e) {
            AALogger.error('HTMLObjectSearch', 'scrollIntoView', e.message);
        }
    }

    function scrollWithYOffset(element, useWindow, frame) {
        AALogger.log('HTMLObjectSearch', 'scrollWithYOffset', element, 'useWindow', useWindow, 'frame', frame !== undefined)
        var positionX = 0;
        var positionY = 0;
        try {
            while (element != null){
                positionX += element.offsetLeft;
                positionY += element.offsetTop - 100;
                element = element.offsetParent;
                if (useWindow) {
                    window.scrollTo(positionX, positionY);
                } else if (frame){
                    frame.contentWindow.scrollTo(positionX, positionY);
                } else {
                    element.scrollTo(positionX, positionY);
                }
            }
        } catch (e) {
            AALogger.error('HTMLObjectSearch', 'scrollWithYOffset', e.message);
        }
    }

    this.CrossDomainFrameSearch = function (ObjHtml, browser, frameDOMXPath, RequestAction) {
        try {
            if (ObjHtml != null) {
                CurrentBrowser = browser;
                myElement = retrieveHtmlElementByXPath(frameDOMXPath);
                CrossDomainIframeInfo.RequestMethod = GETFRAMEINDEX;
                CrossDomainIframeInfo.Framedomxpath = frameDOMXPath;
                var iframe_jsondata = JSON.stringify(CrossDomainIframeInfo);
                myElement[0].contentWindow.postMessage(iframe_jsondata, "*");
                var playframeindex = getIFrameIndex(frameDOMXPath);
                if (playframeindex != undefined) {
                    return getCrossDomainFrameInfo(myElement[0].src, frameDOMXPath, RequestAction, playframeindex);
                } else {
                    return CROSSDOMAIN_IFRAME_NOTAVAILABLE;
                }
            }
        } catch (e) {
            AALogger.error('HTMLObjectSearch', 'Search', e.message);
            return CROSSDOMAIN_IFRAME_NOTAVAILABLE;
        }
    }
    function getCrossDomainFrameInfo(framesrc, frameDOMXPath, RequestAction, playframeindex) {
        var framelist = document.getElementsByTagName("frame")
        var framePath;
        var iframedata = [];
        iframedata.push(['CrossDomainFrameIndex', playframeindex]);
        for (i = 0; i < framelist.length; i++) {
            if (framelist[i].src == framesrc) {
                var htmlCommon = new HTMLCommon(framelist[i]);
                framePath = htmlCommon.GetDOMXPath();
                if (framePath == frameDOMXPath) {
                    if (RequestAction == HTMlRequestAction.SEARCH_OBJECT) {
                        var frameBoundingRect = framelist[i].getBoundingClientRect();
                        iframedata.push(['ParentLeft', frameBoundingRect.left]);
                        iframedata.push(['ParentTop', frameBoundingRect.top]);
                    }
                    return iframedata;
                }
            }
        }
        if (framelist.length == 0) {
            framelist = document.getElementsByTagName("iframe")
            for (j = 0; j < framelist.length; j++) {
                if (framelist[j].src == framesrc) {
                    var htmlCommon = new HTMLCommon(framelist[j]);
                    framePath = htmlCommon.GetDOMXPath();
                    if (framePath == frameDOMXPath) {
                        if (RequestAction == HTMlRequestAction.SEARCH_OBJECT) {
                            var frameBoundingRect = framelist[j].getBoundingClientRect();
                            iframedata.push(['ParentLeft', frameBoundingRect.left]);
                            iframedata.push(['ParentTop', frameBoundingRect.top]);
                        }
                        return iframedata;
                    }
                }
            }
        }
        return iframedata;
    }

    //Take frame index which has control.
    function getFrameToPlay(frameInfo, searchCriteria) {
        for (var frameIndex = 1; frameIndex < _htmlDocArray.length; frameIndex++) {
            if (_htmlDocArray[frameIndex].MatchFrame(frameInfo, searchCriteria)) {
                var ownerDoc = null;
                if (_htmlDocArray[frameIndex].ContentDocument.clientWidth == undefined)
                    ownerDoc = _htmlDocArray[frameIndex].ContentDocument.documentElement;
                else
                    ownerDoc = _htmlDocArray[frameIndex].ContentDocument;
                var common = new HTMLCommon(_htmlDocArray[frameIndex].Frame);
                var frameTop = common.GetHTMLIETop(0, true);
                var frameLeft = common.GetHTMLIELeft(0, true);

                if (frameTop == NaN) frameTop = 0;
                if (frameLeft == NaN) frameLeft = 0;

                if (_htmlDocArray[frameIndex].FrameLocation[0] > document.documentElement.clientWidth || _htmlDocArray[frameIndex].FrameLocation[1] > document.documentElement.clientHeight ||
                    _htmlDocArray[frameIndex].FrameLocation[0] < 0 || _htmlDocArray[frameIndex].FrameLocation[1] < 0 ||
                    frameLeft < 0 || frameTop < 0 || frameLeft > ownerDoc.clientWidth || frameTop > ownerDoc.clientHeight) {

                    _htmlDocArray[frameIndex].ScrollIntoView();
                    isFrameScroll = true;
                }
                return frameIndex;
            }
        }

        return -1;
    }

    function findFrame(browser, frameInfo, searchCriteria) {
        var foundFrame = findFrameByAll(browser, frameInfo, searchCriteria);
        if (foundFrame != null)
            return foundFrame;

        return findFrameByPath(browser, frameInfo, searchCriteria);
    }

    function hasFramePropertyPresent(searchCriteria) {
        for (var index = 0; index < searchCriteria.length; index++) {
            var criteria = searchCriteria[index];
            if (criteria == HTMLPropertyEnum.IEFrameName || criteria == HTMLPropertyEnum.IEFrameSrc) {
                return true;
            }
        }
        return false;
    }

    function findFrameByAll(browser, frameInfo, searchCriteria) {
        fillAllFrames(browser, frameInfo);
        var hasFrameProperty = hasFramePropertyPresent(searchCriteria);
        if (!hasFrameProperty)
            return null;
        var frameIndexToPlay = getFrameToPlay(frameInfo, searchCriteria);
        if (frameIndexToPlay != -1) {
            fillAllFrames(browser, frameInfo);
            return _htmlDocArray[frameIndexToPlay];
        }
        else {
            return null;
        }
    }

    function findFrameByPath(browser, frameInfo, searchCriteria) {
        if (frameInfo.FramePath == String.Empty)
            return null;

        framePathNode = frameInfo.FramePath.split('/');
        if (framePathNode.length == 0)
            return null;
        var mainDocument = document;

        var foundFrame = null;
        var parentLocation = new Array(2);
        parentLocation[0] = 0;
        parentLocation[1] = 0;

        for (var index = 0; index < framePathNode.length; index++) {
            var tempNode = framePathNode[index].split('[');
            var frameTagName = tempNode[0];
            var frameIndex = parseInt(tempNode[1].substring(0, tempNode[1].length - 1));
            var frames = getDocumentFrames(mainDocument, undefined, frameTagName);

            if (frames.length < frameIndex)
                return null;

            var frameAtIndex = frames[frameIndex - 1];
            try {
                mainDocument = getDocumentFromFrame(frameAtIndex);
                if (mainDocument == null)
                    return null;
            } catch (e) {
                //Permission (Access Denied) Exception is thrown
                //This exception is thrown for Cross-Domain frames
                continue;
            }

            foundFrame = new HTMLFrameInfo(mainDocument, frameAtIndex);
            foundFrame.SetFrameLocation(parentLocation);
            foundFrame.SetFrameName();
            parentLocation = foundFrame.FrameLocation;
        }

        if (foundFrame != undefined) {
            if (frameInfo.MatchFrame(foundFrame, searchCriteria))
                return foundFrame;
        }

        return null;
    }

    function getDocumentFromFrame(frame) {
        if (frame.contentDocument != undefined)
            return frame.contentDocument;
        else if (frame.document != undefined) {
            if (frame.window != undefined) //Normal Mode(IE 8 and above)
                return frame.window.document;
            else if (frame.contentWindow != undefined) //Quirks Mode
                return frame.contentWindow.document;
        }
        return null;
    }

    function fillMainDocument(browser) {
        var frameInfo = new HTMLFrameInfo(document, null);
        frameInfo.SetFrameLocation(new Array(2));
        frameInfo.SetFrameName();
        _htmlDocArray.push(frameInfo);
    }

    function fillAllFrames(browser, frameInfo) {
        _htmlDocArray = new Array();
        fillMainDocument(browser);
        var parentLocation = new Array(2);
        parentLocation[0] = 0;
        parentLocation[1] = 0;
        if (frameInfo.HasFrame) {
            getAllFrames(document, parentLocation, PROP_FRAME, browser);
            if (!HTMLCommon._isIE8())
                getAllFrames(document, parentLocation, PROP_IEFRAME, browser);
        }
    }

    function OnlyXpathInSearchCritaria(SearchCriteria, ObjHtml) {
        if (SearchCriteria.length == 1 && SearchCriteria[0] == HTMLPropertyEnum.DOMXPath)
            return true;

        return false;
    }

    function findElement(ObjHtml, searchCriteria) {
        var _htmlCommonObj = new HTMLCommon(_HTMLDoc);
        if (OnlyXpathInSearchCritaria(searchCriteria)) {
            if (findElementByXPathForIE(ObjHtml, searchCriteria))
                return myElement;
            else
                return null;
        } else {
            return findElementByAllAlgorithm(ObjHtml, searchCriteria);
        }
    }

    function findElementByAllAlgorithm(ObjHtml, searchCriteria) {
        if (findElementByID(ObjHtml, searchCriteria))
            return myElement;
        else if (findElementByXPathForIE(ObjHtml, searchCriteria))
            return myElement;
        else if (findElementByPath(ObjHtml, searchCriteria))
            return myElement;
        else if (findElementByName(ObjHtml, searchCriteria))
            return myElement;
        else if (findElementByClass(ObjHtml, searchCriteria))
            return myElement;
        else if (findElementByTagIndex(ObjHtml, searchCriteria))
            return myElement;
        else if (findElementByAllByInnerText(ObjHtml, searchCriteria))
            return myElement;
        else if (findElementByAll(ObjHtml, searchCriteria))
            return myElement;
        else if (CaptureVersion < 0 && (findElementByAllByInnerTextV2_formigratedcommands(ObjHtml, searchCriteria)))
            return myElement;
        else
            return null;
    }

    function findElementByAll(HTMLObjectToSearch, SearchCriteria) {
        if (CaptureVersion !=null && CaptureVersion >= 2400) {
            return findElementByAllV2(HTMLObjectToSearch, SearchCriteria);
        } else {
            return findElementByAllOld(HTMLObjectToSearch, SearchCriteria);
        }
    }

    function findElementByAllV2(HTMLObjectToSearch, SearchCriteria) {
        try {
            var xPath = getXPath(SearchCriteria, HTMLObjectToSearch);
            if (xPath == "")
                return false;

            var elementList = retrieveHtmlElementByXPath(xPath);

            if (elementList == null)
                return false;

            if (elementList.length == 0)
                return false;
            else {
                for (var index = 0; index < elementList.length; index++) {

                    var _htmlCommon = new HTMLCommon(elementList[index]);
                    var htmlSearchedObject = _htmlCommon.GetHTMLSearchedObject(DOMLocation, elementList[index], HTMlRequestAction.SEARCH_OBJECT, SearchCriteria);

                    if (HTMLObjectToSearch.CompareProperties(htmlSearchedObject, SearchCriteria)) {
                        myElement = elementList[index];
                        return true;
                    }
                }
                return false;
            }
        } catch (e) {
            return false;
        }
    }

    function findElementByAllOld(HTMLObjectToSearch, SearchCriteria) {
        try {
            var xPath = getXPath(SearchCriteria, HTMLObjectToSearch);
            if (xPath == "")
                return false;

            var elementList = retrieveHtmlElementByXPath(xPath);

            if (elementList == null)
                return false;

            if (elementList.length == 0)
                return false;
            else {
                myElement = elementList[0];
                return true;
            }
        } catch (e) {
            return false;
        }
    }

    function removeStarFromString(strValue) {
        var finalStrValue;
        try {
            finalStrValue = strValue;
            if (strValue == '*' || strValue == '**')
                return finalStrValue;

            if (finalStrValue.charAt(0) == '*')
                finalStrValue = finalStrValue.substr(1);

            if (finalStrValue.charAt(finalStrValue.length - 1) == '*')
                finalStrValue = finalStrValue.substr(0, finalStrValue.length - 1);

            return finalStrValue;
        } catch (e) {
            return finalStrValue;
        }
    }

    function getXPath(searchCriteria, htmlObject) {
        if (htmlObject.IEClass == "" && htmlObject.IEHref == "" && htmlObject.IEID == "" && htmlObject.IEName == "" &&
            htmlObject.IEType == "" && htmlObject.IEType == "" && htmlObject.IEValue == "")
            return "";

        var xpath = "//";

        if (htmlObject.IETag != "")
            xpath = xpath + htmlObject.IETag.toLowerCase();
        else
            xpath = xpath + "*";

        for (var index = 0; index < searchCriteria.length; index++) {
            if (searchCriteria[index] == HTMLPropertyEnum.IETag)
                continue;

            if (xpath.indexOf("[") == -1)
                xpath = xpath + "[";

            switch (searchCriteria[index]) {
                case HTMLPropertyEnum.IEInnerText:
                    var innerHTML = removeStarFromString(htmlObject.IEInnerText);
                    xpath = xpath + "contains(text(),'" + innerHTML + "')" + " and ";
                    break;
                case HTMLPropertyEnum.IEClass:
                    var classStr = removeStarFromString(htmlObject.IEClass);
                    xpath = xpath + "contains(@class,'" + classStr + "')" + " and ";
                    break;
                case HTMLPropertyEnum.IEHref:
                    var hrefStr = removeStarFromString(htmlObject.IEHref);
                    xpath = xpath + "contains(@href,'" + hrefStr + "')" + " and ";
                    break;
                case HTMLPropertyEnum.IEID:
                    var idStr = removeStarFromString(htmlObject.IEID);
                    xpath = xpath + "contains(@id,'" + idStr + "')" + " and ";
                    break;
                case HTMLPropertyEnum.IEName:
                    var nameStr = removeStarFromString(htmlObject.IEName);
                    xpath = xpath + "contains(@name,'" + nameStr + "')" + " and ";
                    break;
                case HTMLPropertyEnum.IEType:
                    var typeStr = removeStarFromString(htmlObject.IEType);
                    xpath = xpath + "contains(@type,'" + typeStr + "')" + " and ";
                    break;
                case HTMLPropertyEnum.IEValue:
                    var valueStr = removeStarFromString(htmlObject.IEValue);
                    xpath = xpath + "contains(@value,'" + valueStr + "')" + " and ";
                    break;
            }
        }

        if (xpath.length > 4 && xpath.lastIndexOf("and") == xpath.length - 4)
            xpath = xpath.substr(0, xpath.length - 4);
        if (xpath.indexOf("[") != -1)
            return xpath + "]";
        else
            return xpath;
    }

    function findElementByTagIndex(HTMLObjectToSearch, SearchCriteria) {
        if (HTMLObjectToSearch.IETagIndex == undefined)
            return false;
        else if (HTMLObjectToSearch.IETag == undefined || HTMLObjectToSearch.IETag == "")
            return false;
        else if (HTMLObjectToSearch.IETagIndex == 0)
            return false;
        else if (HTMLObjectToSearch.IETag.length == 0)
            return false;
        else {
            var elementList = _HTMLDoc.getElementsByTagName(HTMLObjectToSearch.IETag);
            if (elementList == null)
                return false;
            else if (elementList.length < HTMLObjectToSearch.IETagIndex - 1)
                return false;
            else {
                var searchedElement = elementList[HTMLObjectToSearch.IETagIndex - 1];
                var _htmlCommon = new HTMLCommon(searchedElement);
                var htmlSearchedObject = _htmlCommon.GetHTMLSearchedObject(DOMLocation, searchedElement, HTMlRequestAction.SEARCH_OBJECT, SearchCriteria);

                if (HTMLObjectToSearch.CompareProperties(htmlSearchedObject, SearchCriteria)) {
                    myElement = searchedElement;
                    return true;
                } else
                    return false;
            }
        }

    }

    function findElementByID(HTMLObjectToSearch, SearchCriteria) {
        if (HTMLObjectToSearch.IEID == undefined)
            return false;

        if (HTMLObjectToSearch.IEID == null)
            return false;

        if (HTMLObjectToSearch.IEID == "")
            return false;

        try {
            var searchedElement = _HTMLDoc.getElementById(HTMLObjectToSearch.IEID);
            if (searchedElement == null)
                return false;


            var _htmlCommon = new HTMLCommon(searchedElement);
            var searchedHTMLObject = _htmlCommon.GetHTMLSearchedObject(DOMLocation, searchedElement, HTMlRequestAction.SEARCH_OBJECT, SearchCriteria);

            if (HTMLObjectToSearch.CompareProperties(searchedHTMLObject, SearchCriteria)) {
                myElement = searchedElement;
                return true;
            }
            else
                return false;
        } catch (e) {
            AALogger.error('HTMLObjectSearch', 'findElementByID', e.message);
            return false;
        }
    }

    function findElementByClass(HTMLObjectToSearch, searchCriteria) {
        if (HTMLObjectToSearch.IEClass == undefined)
            return false;

        if (HTMLObjectToSearch.IEClass == null)
            return false;

        if (HTMLObjectToSearch.IEClass == "")
            return false;

        try {

            var searchedObject = _HTMLDoc.getElementsByClassName(HTMLObjectToSearch.IEClass);
            if (searchedObject == null)
                return false;

            if (searchedObject.length == 0)
                return false;

            for (var index = 0; index < searchedObject.length; index++) {

                var _htmlCommon = new HTMLCommon(searchedObject[index]);
                var htmlSearchedObject = _htmlCommon.GetHTMLSearchedObject(DOMLocation, searchedObject[index], HTMlRequestAction.SEARCH_OBJECT, searchCriteria);

                if (HTMLObjectToSearch.CompareProperties(htmlSearchedObject, searchCriteria)) {
                    myElement = searchedObject[index];
                    return true;
                }
            }

            return false;
        } catch (e) {
            AALogger.error('HTMLObjectSearch', 'findElementByClass', e.message);
            return false;
        }
    }

    function findElementByName(HTMLObjectToSearch, searchCriteria) {
        if (HTMLObjectToSearch.IEName == undefined)
            return false;

        if (HTMLObjectToSearch.IEName == null)
            return false;

        if (HTMLObjectToSearch.IEName == "")
            return false;

        try {
            var searchedObject = _HTMLDoc.getElementsByName(HTMLObjectToSearch.IEName);
            if (searchedObject == null)
                return false;

            if (searchedObject.length == 0)
                return false;

            for (var index = 0; index < searchedObject.length; index++) {
                var _htmlCommon = new HTMLCommon(searchedObject[index]);
                var htmlSearchedObject = _htmlCommon.GetHTMLSearchedObject(DOMLocation, searchedObject[index], HTMlRequestAction.SEARCH_OBJECT, searchCriteria);

                if (HTMLObjectToSearch.CompareProperties(htmlSearchedObject, searchCriteria)) {
                    myElement = searchedObject[index];
                    return true;
                }
            }

            return false;
        } catch (e) {
            AALogger.error('HTMLObjectSearch', 'findElementByName', e.message);
            return false;
        }
    }

    function findElementByXPathForIE(HTMLObjectToSearch, searchCriteria) {
        try {
            if (HTMLObjectToSearch.DOMXPath == undefined || HTMLObjectToSearch.DOMXPath == "")
                return false;

            searchedObject = retrieveHtmlElementByXPath(HTMLObjectToSearch.DOMXPath);

            if (searchedObject == null || searchedObject.length == 0) {
                return false;
            } else {
                for (var index = 0; index < searchedObject.length; index++) {
                    var _htmlCommon = new HTMLCommon(searchedObject[index]);
                    var htmlSearchedObject = _htmlCommon.GetHTMLSearchedObject(DOMLocation, searchedObject[index], HTMlRequestAction.SEARCH_OBJECT, searchCriteria);
                    if (HTMLObjectToSearch.CompareProperties(htmlSearchedObject, searchCriteria)) {
                        myElement = searchedObject[index];
                        return true;
                    }
                }

                return false;
            }
        } catch (e) {
            AALogger.error('HTMLObjectSearch', 'findElementByXPathForIE', e.message);
            return false;
        }
    }

    function findHtmlElementByPathIE8(path, bodyNode) {
        for (var index = 0; index < path.length; index++) {
            try {
                var nodeIndex = parseInt(path[index]);

                if (nodeIndex < 0)
                    nodeIndex = bodyNode.children.length + nodeIndex;
                else
                    nodeIndex = nodeIndex - 1;

                if (bodyNode.children.length < nodeIndex) {
                    bodyNode = null;
                    break
                } else
                    bodyNode = bodyNode.children[nodeIndex];
            } catch (e) {
                AALogger.error('HTMLObjectSearch', 'findElementByPath', e.message);
                return null;
            }
        }

        return bodyNode;
    }

    function findHtmlElementByPathBySibling(path, bodyNode) {
        for (var pathIndex = 0; pathIndex < path.length; pathIndex++) {
            var elementAtIndex = getElementAtIndex(bodyNode, path[pathIndex])
            if (elementAtIndex == null)
                return null;
            bodyNode = elementAtIndex;
        }
        return bodyNode;
    }

    function getElementAtIndex(parentElement, nodeIndex) {
        var nodeElement;
        var index = 0;
        if (nodeIndex < 0) {
            nodeElement = parentElement.lastElementChild;
            index--;
        } else {
            nodeElement = parentElement.firstElementChild;
            index++;
        }

        while (nodeElement != null) {
            if (index == nodeIndex)
                return nodeElement;
            if (nodeIndex < 0) {
                nodeElement = nodeElement.previousElementSibling;
                index--;
            } else {
                nodeElement = nodeElement.nextElementSibling;
                index++;
            }
        }

        return null;
    }

    function findElementByPath(HTMLObjectToSearch, searchCriteria) {
        if (HTMLObjectToSearch.Path == "")
            return false;

        var bodyNode;
        if (_HTMLDoc.body == undefined)
            bodyNode = _HTMLDoc.ownerDocument.body;
        else
            bodyNode = _HTMLDoc.body;

        var pathNode = HTMLObjectToSearch.Path.split('|');

        if (HTMLCommon._isIE8())
            bodyNode = findHtmlElementByPathIE8(pathNode, bodyNode);
        else
            bodyNode = findHtmlElementByPathBySibling(pathNode, bodyNode);

        if (bodyNode == null || bodyNode == undefined)
            return false;

        var _htmlCommon = new HTMLCommon(bodyNode);
        var htmlBodyNode = _htmlCommon.GetHTMLSearchedObject(DOMLocation, bodyNode, HTMlRequestAction.SEARCH_OBJECT, searchCriteria);

        if (HTMLObjectToSearch.CompareProperties(htmlBodyNode, searchCriteria)) {
            myElement = bodyNode;
            return true;
        } else {
            return false;
        }
    }

    function getDocumentFrames(doc, browser, tagName) {
        if (HTMLCommon._isIE8())
            return doc.frames;

        return doc.getElementsByTagName(tagName);
    }

    function getAllFrames(doc, pLocation, tagName, browser) {
        var FrameArray = getDocumentFrames(doc, browser, tagName);
        if (FrameArray != null && FrameArray.length > 0) {
            for (var i = 0; i < FrameArray.length; i++) {
                var frameDoc = null;
                try {
                    frameDoc = getDocumentFromFrame(FrameArray[i]);
                    if (frameDoc == undefined)
                        continue;
                } catch (e) {
                    AALogger.error('HTMLObjectSearch', 'getAllFrames', e.message);
                    continue;
                }
                var frameInfo = new HTMLFrameInfo(frameDoc.documentElement, FrameArray[i]);
                frameInfo.SetFrameLocation(pLocation);
                frameInfo.SetFrameName();
                _htmlDocArray.push(frameInfo);

                if (HTMLCommon._isIE8())
                    doc = frameDoc;
                else
                    doc = frameInfo.ContentDocument;

                getAllFrames(doc, frameInfo.FrameLocation, PROP_FRAME, browser);
                if (!HTMLCommon._isIE8())
                    getAllFrames(doc, frameInfo.FrameLocation, PROP_IEFRAME, browser);
            }
        }
    }

    function findElementByAllByInnerText(HTMLObjectToSearch, SearchCriteria) {
        try{
            if (HTMLObjectToSearch.IEInnerText != undefined && HTMLObjectToSearch.IEInnerText.length > 0) {
                var innerTextStr = removeStarFromString(HTMLObjectToSearch.IEInnerText);
                var searchString = "//";
                if (HTMLObjectToSearch.IETag != undefined && HTMLObjectToSearch.IETag.length > 0)
                    searchString = searchString + HTMLObjectToSearch.IETag.toLowerCase();
                else
                    searchString = searchString + "*";

                searchString = searchString + "[contains(text(),'" + innerTextStr + "')]";

                var elementList = retrieveHtmlElementByXPath(searchString);

                if (elementList == null)
                    return false;

                for (var index = 0; index < elementList.length; index++) {
                    var elementAt = elementList[index];
                    var _htmlCommon = new HTMLCommon(elementAt);
                    var htmlSearchedObject = _htmlCommon.GetHTMLSearchedObject(DOMLocation, elementAt, HTMlRequestAction.SEARCH_OBJECT, SearchCriteria);

                    if (HTMLObjectToSearch.CompareProperties(htmlSearchedObject, SearchCriteria)) {
                        myElement = elementAt;
                        return true;
                    }
                }
                return false;
            } else
                return false;
        } catch (e) {
            AALogger.error('HTMLObjectSearch', 'findElementByAllByInnerText', e.message);
            return false;
        }
    }

    function findElementByAllByInnerTextV2_formigratedcommands(HTMLObjectToSearch, SearchCriteria) {
        try {
            if ((HTMLObjectToSearch.IEInnerText != undefined && HTMLObjectToSearch.IEInnerText.length > 0) && (HTMLObjectToSearch.IETag != undefined && HTMLObjectToSearch.IETag.length > 0)) {
                var innerTextStr = removeStarFromString(HTMLObjectToSearch.IEInnerText);
                var searchString = "//*" + "[contains(text(),'" + innerTextStr + "')]/ancestor::" + HTMLObjectToSearch.IETag.toLowerCase();
                var elementList = retrieveHtmlElementByXPath(searchString);
                if (elementList == null)
                    return false;
                for (var index = 0; index < elementList.length; index++) {
                    var elementAt = elementList[index];
                    var _htmlCommon = new HTMLCommon(elementAt);
                    var htmlSearchedObject = _htmlCommon.GetHTMLSearchedObject(DOMLocation, elementAt, HTMlRequestAction.SEARCH_OBJECT, SearchCriteria);
                    if (HTMLObjectToSearch.CompareProperties(htmlSearchedObject, SearchCriteria)) {
                        myElement = elementAt;
                        return true;
                    }
                }
                return false;
            } else
                return false;
        } catch (e) {
            AALogger.error('HTMLObjectSearch', 'findElementByAllByInnerTextV2_formigratedcommands', e.message);
            return false;
        }
    }

    function retrieveHtmlElementByXPath(xPath) {
        var searchedObject;
        AALogger.log('HTMLObjectSearch', 'retrieveHtmlElementByXPath', "XpathEngin=" + AccessibilitySettings.SearchVersion);
        if (_HTMLDoc.evaluateAAXPath == undefined) {
            Reinitialize(_HTMLDoc);
        }
        searchedObject = _HTMLDoc.evaluateAAXPath(xPath, _HTMLDoc, null, 0).nodes;

        return searchedObject;
    }
}
"";
