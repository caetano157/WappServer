function HTMLWindowAvatar(DomLocation, captureHiddenObjects, isVisibleSupported) {
    var PLUGIN_OBJECT_TREE_START = "<PluginObjectTree>";
    var PLUGIN_OBJECT_TREE_END = "</PluginObjectTree>";
    var ROOT_NODE_START = "<RootNode>";
    var ROOT_NODE_END = "</RootNode>";
    var CHILD_NODE_START = "<Chld>";
    var CHILD_NODE_END = "</Chld>";
    var TECHNOLOGY = "<Technology>HTML</Technology>";
    var APPLICATION = "<Application>WEB</Application>";
    var TOTAL_OBJECT = "<TotalObjects>0</TotalObjects>";

    this.Create = function (sendResponse) {
        var xmlObjectTree = PLUGIN_OBJECT_TREE_START;
        xmlObjectTree = xmlObjectTree + TECHNOLOGY;
        xmlObjectTree = xmlObjectTree + APPLICATION;
        xmlObjectTree = xmlObjectTree + TOTAL_OBJECT;
        xmlObjectTree = xmlObjectTree + ROOT_NODE_START;
        sendResponse(xmlObjectTree);
        xmlObjectTree = String.Empty;
        var mainHTMLFrame = new HTMLFrameInfo(document.body, undefined);
        sendResponse(getHtmlObjectProperty(document.body, "",mainHTMLFrame));

        enumHTMLChildren(document.body, "", sendResponse, mainHTMLFrame);

        sendResponse(ROOT_NODE_END + PLUGIN_OBJECT_TREE_END, true);

        return String.Empty;
    }

    this.GetHTMLProperty = function (htmlElement, sendResponse, frameInfo) {
        //return CHILD_NODE_START + getHTMLPropertyString(htmlElement, "",sendResponse) + CHILD_NODE_END;
        sendResponse(CHILD_NODE_START);
        getHTMLPropertyString(htmlElement, "", sendResponse, frameInfo);
        sendResponse(CHILD_NODE_END);
    }

    function getHTMLPropertyString(htmlElement, pPath, sendResponse, frameInfo) {
        var xmlObjectTree = getHtmlObjectProperty(htmlElement, pPath, frameInfo);
        sendResponse(xmlObjectTree);
        enumHTMLChildren(htmlElement, pPath, sendResponse, frameInfo);
    }

    function getHtmlObjectProperty(element, pPath, frameInfo) {
        var htmlCommon = new HTMLCommon(element);
        htmlCommon.IsVisibleSupported = isVisibleSupported;
        var objHtml = htmlCommon.GetHtmlObject(DomLocation, element, HTMlRequestAction.CREATE_AVATAR);
        objHtml.Path = pPath; //pass Frameinfo
        objHtml.IEFramePath = frameInfo.FramePath;
        return objHtml.PropertyInXML();
    }

    function enumHTMLChildren(element, parentPath, sendResponse, frameInfo) {
        if (element == null)
            return String.Empty;
        var forwardIndex = 0;
        var backwardIndex = 0;

        var parentNextFrameInfo= null;
        var parentPreviousFrameInfo = null;

        var objectProperties = String.Empty;
        var isBody = false;
        var nextSibling = element.firstElementChild;
        if (nextSibling == null) {
            if (element.tagName.toLowerCase() == 'iframe' || element.tagName.toLowerCase() == 'frame'){
                try {
                    nextSibling = element.contentDocument.body;
                    isBody = true;
                    var frameIndex = getFrameIndex(element.ownerDocument.documentElement, element);
                    parentNextFrameInfo = new HTMLFrameInfo(element.ownerDocument.documentElement, element)
                    if (frameInfo.FramePath != ''){
                        parentNextFrameInfo.FramePath = frameInfo.FramePath + "/";
                    }
                    parentNextFrameInfo.FramePath = parentNextFrameInfo.FramePath + element.tagName + "[" + frameIndex + "]";
                } catch (e)
                { }
            }
            else
                return String.Empty;
        }
        else
        {
            parentNextFrameInfo = frameInfo;
        }

        var prevSibling = element.lastElementChild;
        if (prevSibling == null) {
            if (element.tagName.toLowerCase() == 'iframe' || element.tagName.toLowerCase() == 'frame'){
                try {
                    prevSibling = element.contentDocument.body;
                    isBody = true;
                    var frameIndex = getFrameIndex(element.ownerDocument.documentElement, element);
                    parentPreviousFrameInfo = new HTMLFrameInfo(element.ownerDocument.documentElement, element)

                    if (frameInfo.FramePath != String.Empty){
                        parentPreviousFrameInfo.FramePath = frameInfo.FramePath + "/";
                    }
                    parentPreviousFrameInfo.FramePath =parentPreviousFrameInfo.FramePath+  element.tagName + "[" + frameIndex + "]";
                } catch (e)
                { }
            }
            else
                return String.Empty;
        }
        else
        {
            parentPreviousFrameInfo = frameInfo;
        }

        var isNextNull = false;
        var isPreviousNull = false;

        while (true) {
            if (nextSibling != null && nextSibling == prevSibling) {
                if (isBody) {
                    var frameAvatar = new HTMLWindowAvatar(getFrameLocation(element), captureHiddenObjects, isVisibleSupported);
                    frameAvatar.GetHTMLProperty(nextSibling,sendResponse, parentNextFrameInfo); //+ CHILD_NODE_END;
                    break;
                }
                else {
                    getNodeString(nextSibling, parentPath, ++forwardIndex, sendResponse, parentNextFrameInfo);
                    break;
                }
            }
            else {

                if (nextSibling != null)
                    getNodeString(nextSibling, parentPath, ++forwardIndex, sendResponse, parentNextFrameInfo);  // CHILD_NODE_START + getHTMLPropertyString(nextSibling,getPath(parentPath, ++forwardIndex)) + CHILD_NODE_END;
                if (prevSibling != null)
                    getNodeString(prevSibling, parentPath, --backwardIndex, sendResponse, parentPreviousFrameInfo); //CHILD_NODE_START + getHTMLPropertyString(prevSibling,getPath(parentPath, --backwardIndex)) + CHILD_NODE_END;
            }

            if (nextSibling != null) {
                nextSibling = nextSibling.nextElementSibling;
                if (nextSibling == prevSibling)
                    break;
            }
            else
                isNextNull = true;

            if (prevSibling != null) {
                prevSibling = prevSibling.previousElementSibling;
            }
            else
                isPreviousNull = true;

            if (isNextNull && isPreviousNull)
                break;
        }

        return String.empty;
    }

    function getPath(objPath, elementIndex) {
        if (objPath != "")
            objPath = objPath + "|";

        return objPath + elementIndex.toString();
    }

    function getNodeString(element, parentPath, objectIndex, sendResponse, frameInfo) {
        if (element.tagName.toLowerCase() != "script") {
        sendResponse(CHILD_NODE_START);
        getHTMLPropertyString(element, getPath(parentPath, objectIndex), sendResponse,frameInfo)
        sendResponse(CHILD_NODE_END);
        }
    }

    function getFrameLocation(htmlElement) {
        var htmlCommon = new HTMLCommon(htmlElement);
        htmlCommon.IsVisibleSupported = isVisibleSupported;
        var objHtml = htmlCommon.GetHtmlObject(DomLocation, htmlElement, HTMlRequestAction.CREATE_AVATAR);

        var framePadding = htmlCommon.GetFramePadding(htmlElement, false);

        var frameLocation = new Array(2);
        frameLocation[0] = objHtml.Left + framePadding[0];
        frameLocation[1] = objHtml.Top + framePadding[1];

        return frameLocation;
    }
}

function HTMLWindowAvatarIE(DomLocation, captureHiddenObjects, isVisibleSupported) {
    var PLUGIN_OBJECT_TREE_START = "<PluginObjectTree>";
    var PLUGIN_OBJECT_TREE_END = "</PluginObjectTree>";
    var ROOT_NODE_START = "<RootNode>";
    var ROOT_NODE_END = "</RootNode>";
    var CHILD_NODE_START = "<Chld>";
    var CHILD_NODE_END = "</Chld>";
    var TECHNOLOGY = "<Technology>HTML</Technology>";
    var APPLICATION = "<Application>WEB</Application>";
    var TOTAL_OBJECT = "<TotalObjects>0</TotalObjects>";
    var xmlObjectTree = String.Empty;

    var isIE8 = false;

    this.Create = function (sendResponse) {
        xmlObjectTree = PLUGIN_OBJECT_TREE_START;
        xmlObjectTree = xmlObjectTree + TECHNOLOGY;
        xmlObjectTree = xmlObjectTree + APPLICATION;
        xmlObjectTree = xmlObjectTree + TOTAL_OBJECT;
        xmlObjectTree = xmlObjectTree + ROOT_NODE_START;

        isIE8 = HTMLCommon._isIE8();

        var mainHTMLFrame = new HTMLFrameInfo(document.body, undefined);

        xmlObjectTree = xmlObjectTree + getHtmlObjectProperty(document.body, "", mainHTMLFrame);

        if (!isIE8)
            enumHTMLChildren(document.body, "", mainHTMLFrame);
        else
        	enumIE8HTMLChildren(document.body, "", mainHTMLFrame);

        xmlObjectTree = xmlObjectTree + ROOT_NODE_END + PLUGIN_OBJECT_TREE_END;

        return xmlObjectTree;
    }


    this.GetHTMLProperty = function (htmlElement, frameInfo) {

        xmlObjectTree = xmlObjectTree + CHILD_NODE_START;
        getHTMLPropertyString(htmlElement, "", frameInfo);
        xmlObjectTree = xmlObjectTree + CHILD_NODE_END;
    }

    function getHTMLPropertyString(htmlElement, pPath, frameInfo) {
        xmlObjectTree = xmlObjectTree + getHtmlObjectProperty(htmlElement, pPath, frameInfo);

        if (!isIE8)
            enumHTMLChildren(htmlElement, pPath, frameInfo);
        else
        enumIE8HTMLChildren(htmlElement, pPath, frameInfo);
    }

    function getHtmlObjectProperty(element, pPath, frameInfo) {
        var htmlCommon = new HTMLCommon(element);
        htmlCommon.IsVisibleSupported = isVisibleSupported;
        var objHtml = htmlCommon.GetHtmlObject(DomLocation, element, HTMlRequestAction.CREATE_AVATAR);
        objHtml.Path = pPath; //pass Frameinfo
        objHtml.IEFramePath = frameInfo.FramePath;
        return objHtml.PropertyInXML();
    }

    function isHidden(element) {
        if (!HTMLCommon.IsVisible(element) || HTMLCommon.IsAriaHidden(element))
            return true;

        return false;
    }

    function enumHTMLChildren(element, parentPath, frameInfo) {
        if (element == null)
            return String.Empty;

        var forwardIndex = 0;
        var backwardIndex = 0;

        var parentNextFrameInfo = null;
        var parentPreviousFrameInfo = null;

        var objectProperties = String.Empty;
        var isBody = false;
        var nextSibling = element.firstElementChild;
        if (nextSibling == null) {
            if (element.tagName.toLowerCase() == 'iframe' || element.tagName.toLowerCase() == 'frame') {
                try {
                    nextSibling = element.contentDocument.body;
                    isBody = true;
                    var frameIndex = getFrameIndex(element.ownerDocument.documentElement, element);
                    parentNextFrameInfo = new HTMLFrameInfo(element.ownerDocument.documentElement, element);
                    if (frameInfo.FramePath != '') {
                        parentNextFrameInfo.FramePath = frameInfo.FramePath + "/";
                    }
                    parentNextFrameInfo.FramePath = parentNextFrameInfo.FramePath + element.tagName + "[" + frameIndex + "]";
                } catch (e)
                { }
            }
            else
                return String.Empty;
        }
        else {
            parentNextFrameInfo = frameInfo;
        }

        var prevSibling = element.lastElementChild;
        if (prevSibling == null) {
            if (element.tagName.toLowerCase() == 'iframe' || element.tagName.toLowerCase() == 'frame') {
                try {
                    prevSibling = element.contentDocument.body;
                    isBody = true;
                    var frameIndex = getFrameIndex(element.ownerDocument.documentElement, element);
                    parentPreviousFrameInfo = new HTMLFrameInfo(element.ownerDocument.documentElement, element);

                    if (frameInfo.FramePath != String.Empty) {
                        parentPreviousFrameInfo.FramePath = frameInfo.FramePath + "/";
                    }
                    parentPreviousFrameInfo.FramePath = parentPreviousFrameInfo.FramePath + element.tagName + "[" + frameIndex + "]";
                } catch (e)
                { }
            }
            else
                return String.Empty;
        }
        else {
            parentPreviousFrameInfo = frameInfo;
        }

        var isNextNull = false;
        var isPreviousNull = false;

        while (true) {
            if (nextSibling != null && nextSibling == prevSibling) {
                if (isBody) {
                    var frameAvatar = new HTMLWindowAvatarIE(getFrameLocation(element), captureHiddenObjects, isVisibleSupported);
                    frameAvatar.GetHTMLProperty(nextSibling, parentNextFrameInfo); //+ CHILD_NODE_END;
                    xmlObjectTree = xmlObjectTree + frameAvatar.GetHTMLObjectTree();
                    break;
                }
                else {
                    getNodeString(nextSibling, parentPath, ++forwardIndex, parentNextFrameInfo);
                    break;
                }
            }
            else {

                if (nextSibling != null)
                    getNodeString(nextSibling, parentPath, ++forwardIndex, parentNextFrameInfo);  // CHILD_NODE_START + getHTMLPropertyString(nextSibling,getPath(parentPath, ++forwardIndex)) + CHILD_NODE_END;
                if (prevSibling != null)
                    getNodeString(prevSibling, parentPath, --backwardIndex, parentPreviousFrameInfo); //CHILD_NODE_START + getHTMLPropertyString(prevSibling,getPath(parentPath, --backwardIndex)) + CHILD_NODE_END;
            }

            if (nextSibling != null) {
                nextSibling = nextSibling.nextElementSibling;
                if (nextSibling == prevSibling)
                    break;
            }
            else
                isNextNull = true;

            if (prevSibling != null) {
                prevSibling = prevSibling.previousElementSibling;
            }
            else
                isPreviousNull = true;

            if (isNextNull && isPreviousNull)
                break;
        }

        return String.empty;
    }

    function enumIE8HTMLChildren(element, parentPath, frameInfo) {
        if (element == null)
            return String.Empty;

        var forwardIndex = 0;
        var backwardIndex = 0;

        var parentNextFrameInfo = frameInfo;
        var parentPreviousFrameInfo = null;

        var objectProperties = String.Empty;
        var isBody = false;

        var elementToIterate = element;

        if (element.tagName.toLowerCase() == 'iframe' || element.tagName.toLowerCase() == 'frame') {
            try {
                elementToIterate = element.contentDocument.body;
                isBody = true;
                var frameIndex = getFrameIndex(element.ownerDocument.documentElement, element);
                parentNextFrameInfo = new HTMLFrameInfo(element.ownerDocument.documentElement, element);
                if (frameInfo.FramePath != '') {
                    parentNextFrameInfo.FramePath = frameInfo.FramePath + "/";
                }
                parentNextFrameInfo.FramePath = parentNextFrameInfo.FramePath + element.tagName + "[" + frameIndex + "]";
            } catch (e)
            { }
        }

        for (var index = 0; index < elementToIterate.children.length; index++) {
            var elementAtIndex = elementToIterate.children[index];

            if (isBody) {
                var frameAvatar = new HTMLWindowAvatarIE(getFrameLocation(element), captureHiddenObjects, isVisibleSupported);
                frameAvatar.GetHTMLProperty(elementToIterate, parentNextFrameInfo); //+ CHILD_NODE_END;
                xmlObjectTree = xmlObjectTree + frameAvatar.GetHTMLObjectTree();
                break;
            }
            else {
                getNodeString(elementAtIndex, parentPath, ++forwardIndex, parentNextFrameInfo);
            }
        }
    }

    this.GetHTMLObjectTree = function () {
        return xmlObjectTree;
    }

    function getPath(objPath, elementIndex) {
        if (objPath != "")
            objPath = objPath + "|";

        return objPath + elementIndex.toString();
    }

    function getNodeString(element, parentPath, objectIndex, frameInfo) {
        if (element.tagName.toLowerCase() != "script") {
            if (!captureHiddenObjects) {
                if (!IsElementOnScreen(element) || isHidden(element))
                    return;
            }

            xmlObjectTree = xmlObjectTree + CHILD_NODE_START;
            getHTMLPropertyString(element, getPath(parentPath, objectIndex), frameInfo);
            xmlObjectTree = xmlObjectTree + CHILD_NODE_END;
        }
    }

    function getFrameLocation(htmlElement) {
        var htmlCommon = new HTMLCommon(htmlElement);
        htmlCommon.IsVisibleSupported = isVisibleSupported;
        var objHtml = htmlCommon.GetHtmlObject(DomLocation, htmlElement, HTMlRequestAction.CREATE_AVATAR);

        var framePadding = htmlCommon.GetFramePadding(htmlElement, isIE8);

        var frameLocation = new Array(2);
        frameLocation[0] = objHtml.Left + framePadding[0];
        frameLocation[1] = objHtml.Top + framePadding[1];

        return frameLocation;
    }

}

function GetWindowAvatar(DomLocation, browser, captureHiddenObjects, isVisibleSupported) {
  if (browser.indexOf("Firefox") != -1) {
        return new HTMLWindowAvatar(DomLocation, captureHiddenObjects, isVisibleSupported);
    }
    return new HTMLWindowAvatarIE(DomLocation, captureHiddenObjects, isVisibleSupported);
}
"";
