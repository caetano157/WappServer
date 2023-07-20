DOMXPath = function () {

    this.GetXPath = function (element) {
        var xPathString = String.Empty;
        if (element && element.id && !attribValHasNumber(element.id)) {
            xPathString = getPathWithId(element);
        } else if (element && element.name && !attribValHasNumber(element.name)) {
            xPathString = getPathWithName(element);
        } else {
            xPathString = getRelativePathWithIndex(element);
        }
        return xPathString;

    }

    function getPathWithName(element) {
        var xPath = String.Format("//{0}[@name='{1}']", [getTagName(element), element.name]); // "//" + getTagName(element) + "[@name='" + element.name + "']";
        var elementList;
        AALogger('HTMLRecorder', 'getPathWithName', "XpathEngin=" + AccessibilitySettings.SearchVersion);
            if (element.ownerDocument.evaluateAAXPath == undefined) {
                Reinitialize(element.ownerDocument);
            }

            elementList = element.ownerDocument.evaluateAAXPath(xPath, element.ownerDocument, null, 0).nodes;

        if (elementList && elementList.length > 1) {
            for (var i = 0; i < elementList.length; i++) {
                if (elementList[i] == element) {
                    xPath = "(" + xPath + ")[" + (i + 1) + "]";
                    break;
                }
            }
        }

        return xPath;
    }

    function getPathWithId(element) {
        return String.Format("//{0}[@id='{1}']", [getTagName(element), element.id]); // "//" + getTagName(element) + "[@id='" + element.id + "']";
    }

    function attribValHasNumber(value) {
        return /\d/.test(value);
    }

    function getTagName(element) {
        try {
            return element.tagName.toLowerCase();
        }
        catch (e) {
            return "*";
        }
    }

    function getRelativePathWithIndex(element) {
        var index = getIndex(element);
        var relativePath = getTagName(element) + "[" + (index + 1) + "]";
        do {
            element = element.parentNode;
            if (element == null)
                break;

            var tagName = getTagName(element);
            if (tagName == "html") {
                relativePath = "/" + tagName + "/" + relativePath;
                break;
            }
            else if (tagName == "body") {
                relativePath = tagName + "/" + relativePath;
            }
            else {
                if (element && element.id) {
                    if (!attribValHasNumber(element.id)) {
                        relativePath = getPathWithId(element) + "/" + relativePath;
                        break;
                    } else {
                        relativePath = assignElementInRelativeXPath(element, tagName, relativePath);
                    }
                } else if (element && element.name) {
                    relativePath = "//" + tagName + "[@name='" + element.name + "']/" + relativePath;
                    break;
                }
                else {
                    relativePath = assignElementInRelativeXPath(element, tagName, relativePath);
                }
            }
        } while (true);
        return relativePath;
    }

    function assignElementInRelativeXPath(element, tagName, relativePath) {
        var frameworkElementPath = PageFramework.GetElementDOMXPath(element);
        if (frameworkElementPath) {
            return frameworkElementPath + "/" + relativePath;
        }
        var index = getIndex(element);
        if (index == 0) {
            return tagName + "[1]/" + relativePath;
        } else {
            return tagName + "[" + (index + 1) + "]/" + relativePath;
        }
    }

    function getFilter(element) {
        var filter = '';
        if (element && element.className)
            filter = "class='" + element.className + "'";
        else if (element && element.name)
            filter = "name='" + element.name + "'";
        return filter;
    }

    function getRelativePath(element) {
        var relativePath = getTagName(element);
        do {
            element = element.parentNode;
            if (element == null)
                break;

            var tagName = getTagName(element);
            if (tagName == "html") {
                relativePath = "/" + tagName + "/" + relativePath;
                break;
            }
            else if (tagName == "body") {
                relativePath = tagName + "/" + relativePath;
            }
            else {
                if (element && element.id) {
                    if (!attribValHasNumber(element.id)) {
                        relativePath = getPathWithId(element) + "/" + relativePath;
                        break;
                    } else if (element && element.name) {
                        relativePath = "//" + tagName + "[@name='" + element.name + "']/" + relativePath;
                        break;
                    }
                    else {

                        var index = getIndex(element);
                        if (index == 0)
                            relativePath = tagName + "[@id='" + element.id + "']/" + relativePath;
                        else
                            relativePath = tagName + "[@id='" + element.id + "']/" + relativePath;

                    }
                } else {

                    var filter = getFilter(element);

                    if (filter == '') {
                        var index = getIndex(element);
                        if (index == 0)
                            relativePath = tagName + "/" + relativePath;
                        else
                            relativePath = tagName + "[" + (index + 1) + "]/" + relativePath;
                    }
                    else {
                        relativePath = tagName + "[@" + filter + "]/" + relativePath;
                    }
                }
            }
        } while (true);
        return relativePath;
    }

    function getIndex(element) {
        var index = 0;
        for (var sibling = element.previousSibling; sibling; sibling = sibling.previousSibling) {
            if (sibling.nodeName == element.nodeName) {
                ++index;
            }
        }
        return index;
    }
};

var ObjectType = {
    ListItem: "ListItem",
    MenuItem: "MenuItem",
    Menu: "Menu",
    PageTabItem: "PageTabItem",
    PageTab: "PageTab",
    TreeViewItem: "TreeViewItem",
    StaticText: "StaticText",
    TextBox: "TextBox",
    PushButton: "PushButton",
    Cell: "Cell",
    Row: "Row",
    Column: "Column",
    RowHeader: "RowHeader",
    ColumnHeader: "ColumnHeader",
    Client: "Client",
    Graphics: "Graphics",
    Image: "Image"
};

HTMLRecorder = function () {
    function getRole(recordedElement) {
        var tagName = recordedElement.tagName;
        if (String.IsNullOrEmpty(tagName)) {
            return String.Empty;
        }

        if (recordedElement.type) {
            tagName += "::" + recordedElement.type;
        }

        var role = ObjectMapper.MapperDictionary.GetValue(tagName);

        if (tagName.toLowerCase() == "select::select-one" && recordedElement.size != undefined && recordedElement.size > 1) {
            role = "ListView";
        }

        if (String.IsNullOrEmpty(role))
            return "Client";

        return role;
    }

    function isParentRequired(role) {
        switch (role) {
            case ObjectType.ListItem:
            case ObjectType.MenuItem:
            case ObjectType.Menu:
            case ObjectType.PageTabItem:
            case ObjectType.PageTab:
            case ObjectType.TreeViewItem:
            case ObjectType.StaticText:
            case ObjectType.TextBox:
            case ObjectType.PushButton:
            case ObjectType.Cell:
            case ObjectType.Row:
            case ObjectType.Column:
            case ObjectType.RowHeader:
            case ObjectType.ColumnHeader:
            case ObjectType.Client:
            case ObjectType.Graphics:
            case ObjectType.Image:
                return true;
            default:
                return false;
        }

    }

    function getParent(recordedElement, roles) {
        var parentElement = recordedElement.parentNode;

        while (parentElement != undefined && parentElement != null) {
            var role = getRole(parentElement);

            if (String.IsNullOrEmpty(role)) {
                return null;
            }

            if (containsRole(roles, role)) {
                if (parentElement.tagName == "a" && (parentElement.offsetHeight == 0 || parentElement.offsetWidth == 0))
                    return null;
                return parentElement;
            }

            parentElement = parentElement.parentNode;
        }

        return null;
    }

    function containsRole(roles, role) {
        if (roles.indexOf != undefined) {
            return roles.indexOf(role) != -1;
        } else {
            for (var index = 0; index < roles.length; index++) {
                if (roles[index] == role) {
                    return true;
                }
            }
            return false;
        }
    }

    function getParentElement(recordedElement, role) {
        var objectTypes = [];

        switch (role) {
            case ObjectType.ListItem:
                objectTypes.push("ListView");
                return getParent(recordedElement, objectTypes);
            case ObjectType.TreeViewItem:
                objectTypes.push("TreeView");
                return getParent(recordedElement, objectTypes);
            case ObjectType.ColumnHeader:
            case ObjectType.RowHeader:
            case ObjectType.Cell:
                objectTypes.push("Table");
                return getParent(recordedElement, objectTypes);
            case ObjectType.PushButton:
                objectTypes.push("ComboBox");
                return getParent(recordedElement, objectTypes);
            case ObjectType.StaticText:
            case ObjectType.TextBox:
                objectTypes.push("ComboBox");
                objectTypes.push("Link");
                objectTypes.push("PushButton");
                return getParent(recordedElement, objectTypes);
            case ObjectType.Graphics:
            case ObjectType.Image:
                objectTypes.push("Link");
                return getParent(recordedElement, objectTypes);
            case ObjectType.Client:
                objectTypes.push("Link");
                objectTypes.push("ComboBox");
                objectTypes.push("PushButton");
                return getParent(recordedElement, objectTypes);
            default:
                return recordedElement;
        }


    }

    function isPointWithinElement(boundClientRect, requestObject) {
        return ((boundClientRect.left <= requestObject.PluginObject.ClickX && boundClientRect.right >= requestObject.PluginObject.ClickX) &&
            (boundClientRect.top <= requestObject.PluginObject.ClickY && boundClientRect.bottom >= requestObject.PluginObject.ClickY));
    }

    function getElementAtPoint(element, requestObject) {
        for (var index = element.children.length - 1; index >= 0; index--) {
            var foundElement = element.children[index];
            var boundClientRect = foundElement.getBoundingClientRect();
            if (isPointWithinElement(boundClientRect, requestObject)) {
                foundElement = getElementAtPoint(foundElement, requestObject);
                return foundElement;
            }
        }

        return element;
    }

    function getElementData(requestObject, currentDocument) {
        var recordedElement = currentDocument.elementFromPoint(requestObject.PluginObject.ClickX, requestObject.PluginObject.ClickY);

        if (recordedElement != null)
            return recordedElement;

        var bodyElement = currentDocument.getElementsByTagName('body')[0];

        for (var index = bodyElement.children.length - 1; index >= 0; index--) {
            var elementToVerify = bodyElement.children[index];

            if (HTMLCommon.IsVisible(elementToVerify)) {
                var boundClientRect = elementToVerify.getBoundingClientRect();
                if (isPointWithinElement(boundClientRect, requestObject)) {
                    return getElementAtPoint(elementToVerify, requestObject);
                }
            }
        }
    }
    function isIFrameCaptureRequestAllowed(requestObject) {
        try {
            let minVersion = HTMLCommon.GetCrossDomainIFrameMinimumCaptureVersion();
            let requestVersion = null;
            if (requestObject && requestObject.PluginObject && requestObject.PluginObject.CaptureVersion) {
                requestVersion = requestObject.PluginObject.CaptureVersion;
            } else if (requestObject && requestObject.ActionData && requestObject.ActionData.CaptureVersion) {
                requestVersion = requestObject.ActionData.CaptureVersion;
            }
            if (!requestVersion || requestVersion < minVersion) {
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    var HtmlFrameInfo;
    var frameInfo = null;
    function getElementFromPoint(requestObject, currentDocument, parentFrameInfo) {
        var recordedElement = getElementData(requestObject, currentDocument);

        if (isUndefinedElement(recordedElement)) {
            //In case of frame we need to get the frame information.
            if (recordedElement.tagName.toLowerCase() == 'frame' || recordedElement.tagName.toLowerCase() == 'iframe') {
                var frameBoundingRect = recordedElement.getBoundingClientRect();
                var frameDocument;
                if (requestObject.PluginObject.ControlType && (requestObject.PluginObject.ControlType == "IFRAME" || requestObject.PluginObject.ControlType == "MAINFRAME")) {
                    _HTMLDoc = currentDocument;
                    HtmlFrameInfo = parentFrameInfo;
                    return recordedElement;
                }
                try {
                    frameDocument = recordedElement.contentWindow.document;
                    frameInfo = new HTMLFrameInfo(frameDocument, recordedElement);
                    frameInfo.HasFrame = true;
                    frameInfo.SetFrameName();
                    frameInfo.SetFrameLocation(requestObject.ParentPoint);
                    var frameIndex = getFrameIndex(currentDocument, recordedElement);
                    if (parentFrameInfo.FramePath != String.Empty) {
                        frameInfo.FramePath = parentFrameInfo.FramePath + "/";
                    }
                    frameInfo.FramePath += recordedElement.tagName + "[" + frameIndex + "]";
                } catch (e) {
                    var errormsg = e.message;
                    if (errormsg.includes('accessing a cross-origin frame') >= 0 && (isIFrameCaptureRequestAllowed(requestObject))) {
                        var iframedata = [];
                        iframedata.push(['src', recordedElement.src]);
                        iframedata.push(['ParentLeft', frameBoundingRect.left]);
                        iframedata.push(['ParentTop', frameBoundingRect.top]);
                        iframedata.push(['ClickX', requestObject.requestClickX]);
                        iframedata.push(['ClickY', requestObject.requestClickY]);
                        iframedata.push(['IsCrossdomainIframe', 'true']);
                        var htmlCommon = new HTMLCommon(recordedElement);
                        var dPath = htmlCommon.GetDOMXPath();
                        iframedata.push(['FrameDOMXPath', dPath]);
                        HtmlFrameInfo = frameInfo;
                        _HTMLDoc = currentDocument;
                        var role = getRole(recordedElement);
                        if (!String.IsNullOrEmpty(role) && isParentRequired(role)) {
                            var parentElement = getParentElement(recordedElement, role);
                            if (parentElement != null) {
                                recordedElement = parentElement;
                            }
                        }
                        var htmlNode;
                        htmlNode = new HTMLCommon(recordedElement).GetHTMLObjectNode(requestObject.ParentPoint, recordedElement, requestObject.RequestAction, HtmlFrameInfo);
                        var parentObject = htmlNode.ToString();
                        iframedata.push(['ParentObject', parentObject]);

                        CrossDomainIframeInfo.RequestMethod = GETFRAMEINDEX;
                        CrossDomainIframeInfo.Framedomxpath = dPath;
                        var iframe_jsondata = JSON.stringify(CrossDomainIframeInfo);
                        recordedElement.contentWindow.postMessage(iframe_jsondata, "*");
                        var CrossframeIndex = getIFrameIndex(dPath);

                        iframedata.push(['CrossdomainIframeIndex', CrossframeIndex]);
                        if (CrossframeIndex !== undefined) {
                            return new HTMLResult().GetCrossDomainErrorString(iframedata);
                        }
                    }
                    HtmlFrameInfo = frameInfo;
                    _HTMLDoc = currentDocument;
                    return recordedElement;
                }

                requestObject.PluginObject.ClickX = requestObject.PluginObject.ClickX - Math.round(frameBoundingRect.left);
                requestObject.PluginObject.ClickY = requestObject.PluginObject.ClickY - Math.round(frameBoundingRect.top);
                //In case of Frame we need to get the actul left and top of the frame location.
                if ((HTMLCommon.GetBrowserName() == HTMLBrowsers.Chrome) || (HTMLCommon.GetBrowserName() == HTMLBrowsers.Firefox)) {
                    requestObject.ParentPoint[0] = requestObject.ParentPoint[0] + Math.round(frameBoundingRect.left * window.devicePixelRatio);
                    requestObject.ParentPoint[1] = requestObject.ParentPoint[1] + Math.round(frameBoundingRect.top * window.devicePixelRatio);
                }
                else {
                    requestObject.ParentPoint[0] = requestObject.ParentPoint[0] + Math.round(frameBoundingRect.left);
                    requestObject.ParentPoint[1] = requestObject.ParentPoint[1] + Math.round(frameBoundingRect.top);
                }

                return getElementFromPoint(requestObject, frameDocument, frameInfo);

            }
            else {
                _HTMLDoc = currentDocument;
                HtmlFrameInfo = parentFrameInfo;
                if (requestObject.PluginObject.ControlType && (requestObject.PluginObject.ControlType == "IFRAME" || requestObject.PluginObject.ControlType === "MAINFRAME")) {
                    return recordedElement = _HTMLDoc.body.parentNode;;
                }
                return recordedElement;
            }
        }
    }

    function isUndefinedElement(element) {
        return element != undefined || element != null;
    }

    HTMLRecorder.prototype.BrowserName = String.Empty;

    HTMLRecorder.prototype.GetObjectNodeFromPoint = function (requestObject) {
        if (requestObject.RequestAction == HTMlRequestAction.DETECT_OBJECT_NODE ||
            requestObject.RequestAction == HTMlRequestAction.CAPTURE_OBJECT_NODE) {

            var currentDocument = document;
            if ((HTMLCommon.GetBrowserName() == HTMLBrowsers.Chrome) || (HTMLCommon.GetBrowserName() == HTMLBrowsers.Firefox)) {
                if (requestObject.PluginObject.IsDefaultDPI == "True") {
                    var screenLeft = window.screenLeft < 2 ? window.screenLeft : window.screenLeft - 8;
                    var screenTop = window.screenTop < 2 ? window.screenTop : window.screenTop - 8;
                    requestObject.PluginObject.ClickX = requestObject.PluginObject.ClickX - (requestObject.ParentPoint[0] + screenLeft);
                    requestObject.PluginObject.ClickY = requestObject.PluginObject.ClickY - (requestObject.ParentPoint[1] + screenTop);
                }
                requestObject.PluginObject.ClickX = (requestObject.PluginObject.ClickX / window.devicePixelRatio);
                requestObject.PluginObject.ClickY = (requestObject.PluginObject.ClickY / window.devicePixelRatio);
            }
            var frameInfo = new HTMLFrameInfo(currentDocument, undefined);
            var recordedElement = getElementFromPoint(requestObject, currentDocument, frameInfo);
            if (typeof recordedElement === 'string') {
                return recordedElement;
            }
            if (isUndefinedElement(recordedElement)) {

                var role = getRole(recordedElement);

                if (!String.IsNullOrEmpty(role) && isParentRequired(role)) {
                    var parentElement = getParentElement(recordedElement, role);
                    if (parentElement != null) {
                        recordedElement = parentElement;
                    }
                }
                var htmlNode;
                var hookHtmlNode = PageFramework.AdjustCapturedElement(recordedElement, requestObject, currentDocument, frameInfo);
                if (hookHtmlNode) {
                    htmlNode = hookHtmlNode;
                } else {
                    htmlNode = new HTMLCommon(recordedElement).GetHTMLObjectNode(requestObject.ParentPoint, recordedElement, requestObject.RequestAction, HtmlFrameInfo);
                }

                if ((HTMLCommon.GetBrowserName() == HTMLBrowsers.Chrome) || (HTMLCommon.GetBrowserName() == HTMLBrowsers.Firefox)) {
                    if (requestObject.PluginObject.IsDefaultDPI == "True") {
                        var screenLeft = window.screenLeft < 2 ? window.screenLeft : window.screenLeft - 8;
                        var screenTop = window.screenTop < 2 ? window.screenTop : window.screenTop - 8;
                        htmlNode.objNode.Left = htmlNode.objNode.Left + screenLeft;
                        htmlNode.objNode.Top = htmlNode.objNode.Top + screenTop;
                    }

                }
                htmlNode.SetFrameDOMXPath(requestObject.FrameDOMXPath);
                return htmlNode.ToString();
            } else {
                var objectnode = new HTMLObjectNode(recordedElement, requestObject.ParentPoint, null);
                objectnode.SetFrameDOMXPath(requestObject.FrameDOMXPath);
                return objectnode.ToString();
            }
        }
        else {
            return new HTMLObjectNode(recordedElement, requestObject.ParentPoint, null).ToString();
        }
    }
}

KeyValuePair = function () {
    KeyValuePair.prototype.Key = String.Empty;
    KeyValuePair.prototype.Value = String.Empty;
}

Dictionary = function () {
    var _keyValuePairs = [];

    Dictionary.prototype.Count = 0;

    Dictionary.prototype.Add = function (key, value) {
        var keyValuePair = new KeyValuePair();
        keyValuePair.Key = key.toLowerCase();
        keyValuePair.Value = value;
        _keyValuePairs.push(keyValuePair);
        this.Count = (_keyValuePairs != undefined) ? _keyValuePairs.length : 0;
    }
    Dictionary.prototype.GetElementAt = function (elementIndex) {
        if (elementIndex >= 0 && elementIndex < this._keyValuePairs.length) {
            return this._keyValuePairs[elementIndex];
        }

        return null;
    }

    Dictionary.prototype.GetValue = function (key) {
        key = key.toLowerCase();
        for (var index = 0; index < _keyValuePairs.length; index++) {
            if (_keyValuePairs[index].Key == key) {
                return _keyValuePairs[index].Value;
            }
        }
        return String.Empty;
    }
    Dictionary.prototype.Remove = function (key) {
        for (var index = 0; index < this._keyValuePairs.length; index++) {
            if (this._keyValuePairs[index].Key == key) {
                this._keyValuePairs.splice(index, 1);
                this.Count = (this._keyValuePairs != undefined) ? this._keyValuePairs.length : 0;
                break;
            }
        }
    }
}

var pluginCommandParser = undefined;

if (typeof window.DOMParser != "undefined") {
    pluginCommandParser = function (xmlStr) {
        return (new window.DOMParser()).parseFromString(xmlStr, "text/xml");
    };
} else if (typeof window.ActiveXObject != "undefined" &&
    new window.ActiveXObject("Microsoft.XMLDOM")) {
    pluginCommandParser = function (xmlStr) {
        var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = "false";
        xmlDoc.loadXML(xmlStr);
        return xmlDoc;
    };
} else {
    throw new Error("No XML parser found");
}

ObjectMapper = function () {};

ObjectMapper.MapperDictionary = new Dictionary();

ObjectMapper.InitializeMapperDictionary = function (xmlString) {
    if (!String.IsNullOrEmpty(xmlString) && ObjectMapper.MapperDictionary.Count == 0) {
        var xmlDocument = parseXml(xmlString);
        var xmlAction = xmlDocument.getElementsByTagName(PLUGINCOMMAND);
        var XMLActionstr = xmlAction[0].attributes.getNamedItem(TYP).nodeValue;
        var xPathEngine = xmlAction[0].attributes.getNamedItem("xpathengine").nodeValue;

        if (xPathEngine != undefined) {
            AccessibilitySettings(xPathEngine);
        }

        AALogger('HTMLREcorder', 'InitializeMapperDictionary', "Current xPathEngin=" + AccessibilitySettings.SearchVersion);

        if (XMLActionstr == HTMlRequestAction.TYPE_MAPPING) {

            var xmlElements = xmlDocument.getElementsByTagName(OBJECT);

            for (var index = 0; index < xmlElements.length; index++) {
                var key = xmlElements[index].attributes.getNamedItem('class').nodeValue;
                var value = xmlElements[index].attributes.getNamedItem('type').nodeValue;
                ObjectMapper.MapperDictionary.Add(key, value);
            }
        }
    }
};

function InitializeObjectMapper(xmlString) {
    ObjectMapper.InitializeMapperDictionary(xmlString);
}

IsEqual = function (value1, value2) {
    value1 = value1.replace(/^\s+|\s+$/g, '');
    value2 = value2.replace(/^\s+|\s+$/g, '');

    if (hasWildCard()) {
        return matchWildcards();
    } else {
        return replaceAndMatch();
    }

    function hasWildCard() {
        return value2 != "" && value2.indexOf("*") != -1;
    }

    function replaceAndMatch() {
        value2 = value2.replace(/(\r\n|\n|\r)/gm, "");
        value1 = value1.replace(/(\r\n|\n|\r)/gm, "");
        return value2.toString() == value1.toString();
    }

    function matchWildcards() {
        value1 = value1.replace(/(\r\n|\n|\r)/gm, "");
        value2 = value2.replace(/(\r\n|\n|\r)/gm, "");
        value1 = value1.replace("&", "");
        value2 = value2.replace("&", "");
        var regexp = new String();
        regexp = value2.replace(
            new RegExp("([{}\(\)\^$&.\/\+\|\[\\\\]|\]|\-)", "g"), "\\$1");
        regexp = regexp.replace(new RegExp("([\*\?])", "g"), ".$1");
        regexp = new RegExp("^" + regexp + "$");

        return value1.search(regexp) >= 0;
    }
};

ScreenRectangle = function (left, top, width, heigh) {
    var _left = getValue(left);
    var _top = getValue(top);
    var _height = getValue(heigh);
    var _width = getValue(width);

    function getValue(value) {
        return ((value == undefined) ? 0 : value);
    }

    this.IsElementOnScreen = function (point) {
        if (point.X() < (_width + _left) && point.Y() < (_height + _top))
            return true;

        return false;
    }

    this.ToString = function () {
        return "Left: " + _left + ", Top: " + _top + ", Width: " + _width + ", Height: " + _height;
    }
};

Point = function (x, y) {
    var _x = x;
    var _y = y;

    this.X = function () {
        return _x;
    }

    this.Y = function () {
        return _y;
    }

    this.ToString = function () {
        return "X:" + _x + ", Y:" + _y;
    }
};


function IsElementOnScreen(element) {
    if (element != null && element != undefined) {
        var doc = element.ownerDocument;
        //var win = doc.defaultView || doc.parentWindow;

        var scrollOffset = getScrollPosition(doc);
        var windowSize = getSize(doc);

        var scrRect = new ScreenRectangle(scrollOffset.X(), scrollOffset.Y(), windowSize.X(), windowSize.Y());
        var boundRect = element.getBoundingClientRect();

        var point = new Point(boundRect.left, boundRect.top);
        return scrRect.IsElementOnScreen(point);
    }
    return false;
}

function getWindowObject(htmlDoc) {
    if (htmlDoc.defaultView != undefined && htmlDoc.defaultView != null)
        return htmlDoc.defaultView;

    return htmlDoc.parentWindow;
}

function getScrollPosition(htmlDoc) {
    var win = getWindowObject(htmlDoc);
    if (win != undefined && win.scrollX != undefined)
        return new Point(window.scrollX, window.scrollY);
    else if (htmlDoc.body != undefined && htmlDoc.body.ScrollLeft != undefined)
        return new Point(htmlDoc.body.ScrollLeft, htmlDoc.body.scrollTop);
    else
        return new Point(htmlDoc.documentElement.scrollLeft, htmlDoc.documentElement.scrollTop);
}

function getSize(htmlDoc) {
    var win = getWindowObject(htmlDoc);
    if (win != undefined && win.innerWidth != undefined)
        return new Point(window.innerWidth, window.innerHeight);
    else
        return new Point(htmlDoc.documentElement.clientWidth, htmlDoc.documentElement.clientHeight);
}
"";
