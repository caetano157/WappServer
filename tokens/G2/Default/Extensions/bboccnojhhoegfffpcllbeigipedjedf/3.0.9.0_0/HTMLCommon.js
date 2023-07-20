//Copyright (c) 2019 Automation Anywhere.
// All rights reserved.
//
// This software is the proprietary information of Automation Anywhere.
//You shall use it only in accordance with the terms of the license agreement
//you entered into with Automation Anywhere.

function HTMLCommon(htmlElement) {
    var scrollX = 0;
    var scrollY = 0;
    this.loaded;
    var Spcl_SymbolAmp = "&";
    var Spcl_Ampersand = "&amp;";

    var Spcl_SymbolLt = "<";
    var Spcl_LessThen = "&lt;";

    var Spcl_SymbolGt = ">";
    var Spcl_GreaterThen = "&gt;";

    var Spcl_SymbolQuot = '"';
    var Spcl_Quotation = "&quot;";

    var Spcl_SymbolApos = "'";
    var Spcl_Apostrophe = "&apos;";
    this.documentIsReady = false;
    this.Values = new Array();
    this.IsVisibleSupported = false;
    this.FrameDOMXPath = String.Empty;

    this.GetFramePadding = function (htmlElement, isIE8) {

        var style = null;
        var paddingLeft = '0';
        var paddingTop = '0';

        try {
            if (!isIE8) {
                style = window.getComputedStyle(htmlElement, null);
            }

            if (style) {
                paddingLeft = style.getPropertyValue('padding-left');
                paddingTop = style.getPropertyValue('padding-top');

                if (paddingLeft != '')
                    paddingLeft = paddingLeft.replace('px', '');

                if (paddingTop != '')
                    paddingTop = paddingTop.replace('px', '');
            }
        }
        catch (e) {
            AALogger('HTMLFrameInfo', 'SetFrameLocation --> window.getComputedStyle', e.message);
        }

        var framePadding = new Array(2);
        framePadding[0] = Convert.ToInt(parseInt(paddingLeft, 10));
        framePadding[1] = Convert.ToInt(parseInt(paddingTop, 10));
        return framePadding;
    }

    this.GetHTMLInnerText = function () {
        return this.GetInnerText(htmlElement);
    }

    this.GetInnerText = function (element) {
        try {
            if (element.innerText != undefined && element.innerText.length > 0)
                return this.Trim(element.innerText);
            else if (element.text != undefined && element.text.length > 0)
                return this.Trim(element.text);
            else if (element.textContent != undefined && element.textContent.length > 0)
                return this.Trim(element.textContent);
            else
                return "";
        }
        catch (e) {
            AALogger('HTMLCommon', 'GetHTMLInnerText', e.message);
            return "";
        }
    }

    this.GetHTMLClassID = function () {
        try {
            if (htmlElement.getAttribute('classid') != undefined)
                return this.Trim(htmlElement.getAttribute('classid'));
            else
                return "";
        }
        catch (e) {
            AALogger('HTMLCommon', 'GetHTMLClassID', e.message);
            return "";
        }
    }

    this.GetHTMLClass = function () {
        try {
            if (htmlElement.className != undefined)
                return this.Trim(htmlElement.className);
            else
                return "";
        }
        catch (e) {
            AALogger('HTMLCommon', 'GetHTMLClass', e.message);
            return "";
        }
    }

    this.GetHTMLHeight = function () {
        try {
            if (htmlElement.offsetHeight != undefined)
                return htmlElement.offsetHeight.toString();
            else
                return "";
        }
        catch (e) {
            AALogger('HTMLCommon', 'GetHTMLHeight', e.message);
            return "";
        }
    }

    this.GetItemCollection = function (htmlElement) {

        this.itemPropertiesObj = [];
        if (htmlElement.children.length > 0) {
            this.GetChildrenItemCollection(htmlElement);
        }

    }

    this.GetChildrenItemCollection = function (htmlElement) {
        try {
            if (htmlElement.children.length > 0) {

                for (var index = 0; index < htmlElement.children.length; index++) {

                    if (htmlElement.children[index] == undefined || htmlElement.children[index].tagName == undefined)
                        continue;
                    var role = retrieveRole(htmlElement.children[index]);
                    if (role == ListItem) {
                        this.itemPropertiesObj.push(this.GetInnerText(htmlElement.children[index]));
                    }
                    else if (htmlElement.children[index].tagName.toLowerCase() == OPTGROUP) {
                        this.GetChildrenItemCollection(htmlElement.children[index]);
                    }

                }
            }
        }
        catch (e) {
            AALogger('HTMLCommon', 'GetChildrenItemCollection', e.message);
            return itemProperties;
        }

    }

    this.GetDOMXPath = function () {
        var xpath = '';

        try {
            var domXPath = new DOMXPath();
            xpath = domXPath.GetXPath(htmlElement);
            return xpath;
        }
        catch (e) {
            AALogger('HTMLCommon', 'GetDOMXPath', e.message);
            return xpath;
        }
    }

    this.SetFrameDOMXPath = function (framedomxpath) {
        try {
            FrameDOMXPath = framedomxpath;
        } catch (e) {
            FrameDOMXPath = String.Empty;
        }
    }
    this.GetFrameDOMXPath = function () {
        try {
            return FrameDOMXPath;

        } catch (e) {
            return String.Empty;
        }
    }

    this.GetHTMLHref = function () {
        try {
            if (htmlElement.tagName != undefined && htmlElement.tagName.toString().toLocaleLowerCase() == 'img') {
                if (htmlElement.src != undefined)
                    return this.Trim(htmlElement.src);
                else
                    return "";
            }
            else if (htmlElement.href != undefined)
                return this.Trim(htmlElement.href);
            else
                return "";
        } catch (e) {
            AALogger('HTMLCommon', 'GetHTMLHref', e.message);
            return "";
        }
    }

    this.GetInnerHTML = function () {
        try {
            if (htmlElement.innerHTML == undefined)
                return "";

            return htmlElement.innerHTML;
        }
        catch (e) {
            AALogger('HTMLCommon', 'GetHTMLHref', e.message);
            return "";
        }
    }

    this.GetOuterHTML = function () {
        try {
            if (htmlElement.outerHTML == undefined)
                return "";

            return htmlElement.outerHTML;
        } catch (e) {
            AALogger('HTMLCommon', 'GetHTMLHref', e.message);
            return "";
        }
    }

    this.GetHTMLOffsetParent = function () {
        try {
            if (htmlElement.offsetParent != undefined) {
                if (htmlElement.offsetParent == null)
                    return "";
                else {
                    if (htmlElement.offsetParent.name != undefined)
                        return htmlElement.offsetParent.name;
                    if (htmlElement.offsetParent.alt != undefined)
                        return htmlElement.offsetParent.alt;
                    else
                        return "";
                }
            } else
                return "";
        } catch (e) {
            AALogger('HTMLCommon', 'GetHTMLOffsetParent', e.message);
            return "";
        }
    }

    this.GetHTMLID = function () {
        try {
            if (htmlElement.id != undefined)
                return this.Trim(htmlElement.id.toString());
            else
                return "";
        }
        catch (e) {
            AALogger('HTMLCommon', 'GetHTMLID', e.message);
            return "";
        }

    }

    this.GETHasFrame = function () {
        try {
            var FrameArray = document.getElementsByTagName(PROP_FRAME);

            if (FrameArray.length > 0)
                hasframe = "true";
            else {
                FrameArray = document.getElementsByTagName(PROP_IEFRAME);
                if (FrameArray.length > 0)
                    hasframe = "true";
                else
                    hasframe = "false";
            }
            return hasframe;
        }
        catch (e) {
            AALogger('HTMLCommon', 'GETHasFrame', e.message);
            return "false";
        }
    }

    this.GetFrameSource = function () {
        try {
            return document.location.href;
        }
        catch (e) {
            AALogger('HTMLCommon', 'GETHasFrame', e.message);
            return "false";
        }
    }

    this.GetFrameName = function () {
        try {
            var frameHref = htmlElement.ownerDocument.location.href;
            var frames = document.getElementsByTagName(PROP_FRAME);
            for (var index = 0; index < frames.length; index++) {
                if (frames[index].src == frameHref)
                    return frames[index].name;
            }
        }
        catch (e) {
            AALogger('HTMLCommon', 'GETHasFrame', e.message);
            return "false";
        }
    }

    this.GetHTMLIELeft = function (parentLeft, scrollFlag) {
        if (htmlElement == null)
            return 0;
        try {
            var element = htmlElement;
            var left = 0;
            while (element != undefined) {
                left += parseInt(element.offsetLeft);
                element = element.offsetParent;

            }

            if (scrollFlag) {
                getScrollPosition();

                if (left == 0)
                    return left + parentLeft;

                return left + parentLeft - scrollX;
            } else {
                return left + parentLeft;
            }
        } catch (e) {
            AALogger('HTMLCommon', 'GetHTMLIELeft', e.message);
            return 0;
        }
    }

    this.GetHTMLName = function () {
        try {
            if (htmlElement.name != undefined)
                return this.Trim(htmlElement.name);
            else
            {
                var nameAttributeValue = htmlElement.getAttribute('name');
                return nameAttributeValue ? nameAttributeValue : "";
            }
        } catch (e) {
            AALogger('HTMLCommon', 'GetHTMLName', e.message);
            return "";
        }
    }

    this.GetHTMLAlt = function () {
        try {
            if (htmlElement.alt != undefined)
                return this.Trim(htmlElement.alt);
            else
                return "";
        } catch (e) {
            AALogger('HTMLCommon', 'GetHTMLAlt', e.message);
            return "";
        }
    }

    this.GetHTMLSourceIndex = function () {
        try {
            if (htmlElement.sourceIndex != undefined || htmlElement.sourceIndex != null)
                return htmlElement.sourceIndex.toString();
            else
                return "";
        } catch (e) {
            AALogger('HTMLCommon', 'GetHTMLSourceIndex', e.message);
            return "";
        }
    }

    this.GetHTMLTag = function () {
        try {
            if (htmlElement.tagName != undefined)
                return this.Trim(htmlElement.tagName.toString());
            else
                return "";
        } catch (e) {
            AALogger('HTMLCommon', 'GetHTMLTag', e.message);
            return "";
        }
    }

    this.GerHTMLTableIndex = function () {
        try {
            var collectionIndex = 0;

            if (htmlElement.tagName.toString() == BODY)
                return collectionIndex;

            var taglist1 = _HTMLDoc.getElementsByTagName(PROP_TABLE);
            for (i = 0; i < taglist1.length; i++) {
                collectionIndex++;

                if (taglist1[i].id != undefined) {
                    if (taglist1[i].id == htmlElement.id)
                        return collectionIndex;
                }
                else if (taglist1[i].sourceIndex != undefined) {
                    if (taglist1[i].sourceIndex == htmlElement.sourceIndex)
                        return collectionIndex;
                }
            }
            return 0;
        } catch (e) {
            AALogger('HTMLCommon', 'GerHTMLTableIndex', e.message);
            return 0;
        }
    }

    this.GetHTMLTagIndexRecording = function (htmlElement) {
        try {
            if (htmlElement.tagName != undefined && htmlElement.tagName.toString() == BODY)
                return 1;

            var taglist1 = htmlElement.ownerDocument.getElementsByTagName(htmlElement.tagName);
            for (i = 0; i < taglist1.length; i++) {
                if (htmlElement == taglist1[i])
                    return (i + 1);
            }
            return 0;

        } catch (e) {
            AALogger('HTMLCommon', 'GetHTMLTagIndex', e.message);
            return 0;
        }
    }

    this.GetHTMLTagIndex = function () {
        try {
            if (htmlElement.tagName != undefined && htmlElement.tagName.toString() == BODY)
                return 1;

            var taglist1 = _HTMLDoc.getElementsByTagName(htmlElement.tagName);
            for (i = 0; i < taglist1.length; i++) {
                if (taglist1[i].id == htmlElement.id &&
                    taglist1[i].name == htmlElement.name &&
                    taglist1[i].innerText == htmlElement.innerText &&
                    taglist1[i].sourceIndex == htmlElement.sourceIndex &&
                    taglist1[i].type == htmlElement.type &&
                    taglist1[i].src == htmlElement.src &&
                    taglist1[i].href == htmlElement.href &&
                    taglist1[i].text == htmlElement.text &&
                    taglist1[i].outerText == htmlElement.outerText
                    )
                    return (i + 1);
            }
            return 0;
        } catch (e) {
            AALogger('HTMLCommon', 'GetHTMLTagIndex', e.message);
            return 0;
        }
    }

    this.GetHTMLTitle = function () {
        try {
            if (htmlElement.title != undefined)
                return this.Trim(htmlElement.title);
            else
                return "";
        }
        catch (e) {
            AALogger('HTMLCommon', 'GetHTMLTitle', e.message);
            return "";
        }
    }

    this.GetHTMLIETop = function (parentTop, scrollFlag) {
        if (htmlElement == null)
            return 0;
        try {
            var element = htmlElement;
            var top = 0;
            while (element != undefined) {
                top += parseInt(element.offsetTop);

                element = element.offsetParent;
            }
            if (scrollFlag) {
                getScrollPosition();

                if (top == 0)
                    return top + parentTop;

                return top + parentTop - scrollY;
            } else {

                return top + parentTop;
            }
        } catch (e) {
            AALogger('HTMLCommon', 'GetHTMLIETop', e.message);
            return 0;
        }
    }

    this.GetHTMLType = function () {
        var htmlType = getHtmlAttribute("type");

        if (htmlElement.type != undefined || htmlElement.type != null) {
            if (htmlType == "")
                return this.Trim(htmlElement.type);
            else
                return this.Trim(htmlType);
        } else
            return this.Trim(htmlType);
    }

    this.GetHTMLValue = function () {
        try {
            if (htmlElement.value != undefined && !isPasswordBox())
                return this.Trim(htmlElement.value);
            else
                return "";
        }
        catch (e) {
            AALogger('HTMLCommon', 'GetHTMLValue', e.message);
            return "";
        }
    }

    this.GetHTMLWidth = function () {
        try {
            if (htmlElement.offsetWidth != undefined)
                return htmlElement.offsetWidth.toString();
            else
                return "";
        } catch (e) {
            AALogger('HTMLCommon', 'GetHTMLWidth', e.message);
            return "";
        }
    }

    this.GetHtmlObject = function (DomLocation, ElementToConvert, requestAction) {
        var comboElement = new HTMLObject(DomLocation);
        comboElement.IsVisibleSupported = this.IsVisibleSupported;
        comboElement.RequestAction = requestAction;
        comboElement.ControlElement = ElementToConvert;
        comboElement.FillProperty();
        return comboElement;
    }

    this.GetHTMLSearchedObject = function(DomLocation,ElementToConvert,requestAction,SearchCriteria) {
        var htmlElement = new HTMLObject(DomLocation);
        htmlElement.IsVisibleSupported = this.IsVisibleSupported;
        htmlElement.RequestAction = requestAction;
        htmlElement.ControlElement = ElementToConvert;
        htmlElement.FillPropertiesBasedOnSearchCriteria(SearchCriteria,false);
        return htmlElement;
    }

    this.GetHTMLObjectNode = function (domLocation, htmlElement, requestAction, frameInfo) {
        var htmlNode = new HTMLObjectNode(htmlElement, domLocation, frameInfo);
        htmlNode.RequestAction = requestAction;
        htmlNode.FillNode(htmlElement);
        return htmlNode;
    }

    this.ReplaceSpacialCharacter = function (inputValue) {
        try {
            if (inputValue != null && inputValue != undefined) {
                var newValue = inputValue.toString().split("&nbsp;").join(" ");
                newValue = newValue.split(Spcl_SymbolAmp).join(Spcl_Ampersand);
                newValue = newValue.split(Spcl_SymbolApos).join(Spcl_Apostrophe);
                newValue = newValue.split(Spcl_SymbolGt).join(Spcl_GreaterThen);
                newValue = newValue.split(Spcl_SymbolLt).join(Spcl_LessThen);
                newValue = newValue.split(Spcl_SymbolQuot).join(Spcl_Quotation);
                return newValue;
            } else
                return "";
        } catch (e) {
            AALogger('HTMLCommon', 'ReplaceSpacialCharacter', e.message);
            return "";
        }
    }

    this.SetSpecialCharacter = function (inputValue) {
        var newValue = inputValue.split(Spcl_Quotation).join(Spcl_SymbolQuot);
        newValue = newValue.split(Spcl_LessThen).join(Spcl_SymbolLt);
        newValue = newValue.split(Spcl_GreaterThen).join(Spcl_SymbolGt);
        newValue = newValue.split(Spcl_Apostrophe).join(Spcl_SymbolApos);
        newValue = newValue.split(Spcl_Ampersand).join(Spcl_SymbolAmp);
        return newValue;
    }

    this.Trim = function (str) {
        if (str == null || str == undefined || str == '')
            return '';

        return str.toString().replace(/^\s+|\s+$/g, '');
    }

    this.ConvertNumberToString = function (num) {
        if (num == undefined || num == NaN || num.toString() == 'NaN' || num.toString() == '')
            return '0';

        return num.toString();
    }

    function retrieveRole(htmlElement) {
        var tagName = htmlElement.tagName;
        if (htmlElement.type) {
            tagName += "::" + htmlElement.type;
        }

        var role = ObjectMapper.MapperDictionary.GetValue(tagName);

        if (String.IsNullOrEmpty(role))
            return "Client";

        if (tagName.toLowerCase() == "select::select-one" && htmlElement.size != undefined && htmlElement.size > 1) {
            role = "ListView";
        }

        return role;
    }

    this.GetRole = function () {
        return retrieveRole(htmlElement);
    }

    this.GetName = function () {
        var elementName = htmlElement.name;

        if (String.IsNullOrEmpty(elementName))
            return String.Empty;

        return elementName;
    }

    this.GetStates = function () {
        try {

            var states = "";

            states += isChecked();

            if (isPasswordBox()) {
                states += "Protected,";
            }

            if (isReadOnly()) {
                states += "ReadOnly,";
            }

            if (isDisabled()) {
                states += "Unavailable,";
            }

            states += isRadioSelected();

            if (states.length > 0) {
                states = states.substring(0, states.length - 1);
            }

            return states;
        } catch (e) {
            AALogger('HTMLCommon', 'GetStates', e.message);
            return "";
        }
    }

    function isChecked() {
        var states = "";
        if (htmlElement.type == CONTROLTYPE_CHECKBOX) {
            if (htmlElement.indeterminate != undefined && htmlElement.indeterminate && htmlElement.checked)
                states += STATUS_INTERMEDIATE + ",";
            else if (htmlElement.checked)
                states += STATUS_CHECKED + ",";
            else if (htmlElement.checked == false)
                states += STATUS_UNCHECKED + ",";
        }
        return states;
    }


    function isRadioSelected() {
        var states = "";
        if (htmlElement.type == CONTROLTYPE_RADIO) {
            if (htmlElement.checked)
                states += STATUS_SELECTED + ",";
            else if (!htmlElement.checked)
                states += STATUS_DESELECTED + ",";
        }
        return states;
    }

    function isPasswordBox() {
        var elementType = htmlElement.type;
        return !String.IsNullOrEmpty(elementType) && (elementType.toLowerCase() == "password");
    }

    function isReadOnly() {
        htmlElement.disabled
        if (htmlElement.readOnly != undefined || htmlElement.disabled != undefined)
            return  Boolean(htmlElement.readOnly);
    }

    function isDisabled() {
        htmlElement.disabled
        if (htmlElement.readOnly != undefined || htmlElement.disabled != undefined)
            return  Boolean(htmlElement.disabled);
    }

    function getHtmlAttribute(attribute) {
        try {
            var htmlAttribute = htmlElement.getAttribute(attribute);

            if (htmlAttribute == null || htmlAttribute == undefined)
                return "";

            return htmlAttribute;
        } catch (e) {
            AALogger('HTMLCommon', 'getHtmlAttribute', e.message);
            return "";
        }
    }

    function getAllScrollValue() {
        try {
            var element = htmlElement;
            scrollY = 0;
            scrollX = 0;
            do {
                if (element.scrollTop != undefined)
                    scrollY += element.scrollTop;

                if (element.scrollLeft != undefined)
                    scrollX += element.scrollLeft;

                element = element.parentNode;
            } while (element != null)
            return true;
        } catch (e) {
            AALogger('HTMLCommon', 'getAllScrollValue', e.message);
            return false;
        }
    }

    function getScrollPositionByWindow() {

        if (window != undefined) {
            if (window.scrollX != undefined) {
                scrollX = window.scrollX;
                scrollY = window.scrollY;
                return true;
            } else
                return false;
        } else
            return false;
    }

    function getScrollPositionByBody() {
        if (document.body != undefined) {
            scrollX = document.body.scrollLeft;
            scrollY = document.body.scrollTop;
            return true;
        } else
            return false;
    }

    function getScrollByDocElement() {
        if (document.documentElement != undefined) {
            scrollX = document.documentElement.scrollLeft;
            scrollY = document.documentElement.scrollTop;
            return true;
        } else
            return false;
    }

    function getScrollPosition() {
        if (getAllScrollValue())
            return true;
        else if (getScrollPositionByWindow())
            return true;
        else if (getScrollByDocElement())
            return true;
        else if (getScrollPositionByBody())
            return true;
        else
            return false;
    }

}
HTMLCommon.GetCrossDomainIFrameMinimumCaptureVersion = function () {
    return 2300;
}
HTMLCommon.GetBrowserName = function () {
    var browser = window.navigator.userAgent.toString();
    if (browser.indexOf(HTMLBrowsers.Chrome) != -1)
        return HTMLBrowsers.Chrome;
    else if (browser.indexOf(HTMLBrowsers.Firefox) != -1)
        return HTMLBrowsers.Firefox;
    else
        "";
}
HTMLCommon._isIE8 = function () {
    return (/MSIE 8[.]/.test(navigator.userAgent) || /MSIE 7[.]/.test(navigator.userAgent));
}

HTMLCommon.ToCamelCase = function (s) {
    var exp = /-([a-z])/;
    for (; exp.test(s); s = s.replace(exp, RegExp.$1.toUpperCase()));
    return s;
};

HTMLCommon.GetStyle = function (element, style) {
    var value = element.style[HTMLCommon.ToCamelCase(style)];

    if (!value) {
        if (element.ownerDocument && element.ownerDocument.defaultView) // FF
            value = element.ownerDocument.defaultView.getComputedStyle(element, String.Empty).getPropertyValue(style);
        else if (element.currentStyle)
            value = element.currentStyle[HTMLCommon.ToCamelCase(style)];
    }
    return value;
}
HTMLCommon.IsStyleDisplay = function (element) {
    var displayValue = HTMLCommon.GetStyle(element, "display");
    return displayValue == null || displayValue != "none";
};

HTMLCommon.IsStyleVisible = function (element) {
    var visibilityValue = HTMLCommon.GetStyle(element, "visibility");
    return visibilityValue == null || visibilityValue != "hidden";
};

HTMLCommon.IsVisible = function (element) {
    try {
        if (element == null)
            return false;

        var originalElement = element;
        var display = true;
        while (true) {
            display = display && HTMLCommon.IsStyleDisplay(element);
            if (!display || element.parentNode == element || element.tagName == "BODY") break;
            element = element.parentNode;
        }
        element = originalElement;
        var visible = true;
        while (true) {
            visible = visible && HTMLCommon.IsStyleVisible(element);
            if (!visible || element.parentNode == element || element.tagName == "BODY") break;
            element = element.parentNode;
        }
        return display && visible;
    } catch (e) {
        return true;
    }
};

HTMLCommon.IsAriaHidden = function (element) {
    try {
        if (element == null)
            return true;

        var htmlAttribute = element.getAttribute("aria-hidden");

        if (htmlAttribute != "true")
            return false;

        return true;
    } catch (e) {
        return true;
    }
}

var sendResponseCallback;
var WriteExceptionLog = true;

function getFrameIndex(currentDocument, frame ){
    var frames = currentDocument.getElementsByTagName(frame.tagName);
    for (var index = 0; frames.length > index ; index++ ) {
        if(frames[index] == frame) {
            return index + 1;
        }
    }
}

function AccessibilitySettings(version) {
    AccessibilitySettings.SearchVersion = version;
}
AccessibilitySettings.SearchVersion = 1;
"";
