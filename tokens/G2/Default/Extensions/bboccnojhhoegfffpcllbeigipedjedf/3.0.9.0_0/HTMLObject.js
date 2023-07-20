//Copyright (c) 2019 Automation Anywhere.
// All rights reserved.
// This software is the proprietary information of Automation Anywhere.
// You shall use it only in accordance with the terms of the license agreement
// you entered into with Automation Anywhere.

function HTMLObject(DomLocation) {
    var HTML_OBJECT_START = "<PluginObject>";
    var HTML_OBJECT_END = "</PluginObject>"

    this.ControlElement = null;
    this.Name = String.Empty;
    this.Role = String.Empty;
    this.States = String.Empty;
    this.IEParent = String.Empty;
    this.IELeft = String.Empty;
    this.IETop = String.Empty;
    this.IEHeight = String.Empty;
    this.IEWidth = String.Empty;
    this.IEID = String.Empty;
    this.IEName = String.Empty;
    this.IETag = String.Empty;
    this.IEClass = String.Empty;
    this.IEInnerText = String.Empty;
    this.IESourceIndex = String.Empty;
    this.IEValue = String.Empty;
    this.IEType = String.Empty;
    this.IEAlt = String.Empty;
    this.IETitle = String.Empty;
    this.IETagIndex = String.Empty;
    this.IEHasFrame = String.Empty;
    this.IEHref = String.Empty;
    this.Left = String.Empty;
    this.Top = String.Empty;
    this.Path = String.Empty; //Start [Path] [Jecky] [Date : 13/03/2013]
    this.DOMXPath = String.Empty;
    this.ItemCollection = String.Empty;
    // Additional Properties
    this.IEClassId = String.Empty;
    this.IEFrameSrc = String.Empty;
    this.IEFrameName = String.Empty;
    this.RequestAction = HTMlRequestAction.NONE;
    this.Path = String.Empty;
    this.InnerHTML = String.Empty;
    this.OuterHTML = String.Empty;
    this.IEFramePath = String.Empty;
    this.IsVisible = true;
    this.IsVisibleSupported = false;
    this.FrameDOMXPath = String.Empty;

    function getErrorMessage(e) {
        var exceptionMessage = e.message;
        if (exceptionMessage == undefined)
        {
            exceptionMessage = e;
        }

        return exceptionMessage;
    }

    this.FillPropertiesBasedOnSearchCriteria = function(HtmlSearchCriteria, isConsiderDOMXPathAndPath)
    {

            if (HtmlSearchCriteria == null) {
                fillAllProperties(this);
                return true;
            }
        var htmlCommon = new HTMLCommon(this.ControlElement);

            for (var index = 0; index < HtmlSearchCriteria.length; index++) {
                switch (HtmlSearchCriteria[index]) {
                    case HTMLPropertyEnum.Name:
                        this.Name = htmlCommon.GetName();
                        break;
                    case HTMLPropertyEnum.Role:
                        this.Role = htmlCommon.GetRole();
                        break;
                    case HTMLPropertyEnum.States:
                        this.States = htmlCommon.GetStates();
                        break;
                    case HTMLPropertyEnum.IEParent:
                        this.IEParent = htmlCommon.GetHTMLOffsetParent();
                        break;
                    case HTMLPropertyEnum.IEID:
                        this.IEID = htmlCommon.GetHTMLID();
                        break;
                    case HTMLPropertyEnum.IEName:
                        this.IEName = htmlCommon.GetHTMLName();
                        break;
                    case HTMLPropertyEnum.IETag:
                        this.IETag = htmlCommon.GetHTMLTag();
                        break;
                    case HTMLPropertyEnum.IEClass:
                        this.IEClass = htmlCommon.GetHTMLClass();
                        break;
                    case HTMLPropertyEnum.IEInnerText:
                        this.IEInnerText = htmlCommon.GetHTMLInnerText();
                        break;
                    case HTMLPropertyEnum.IESourceIndex:
                        this.IESourceIndex = htmlCommon.GetHTMLSourceIndex();
                        break;
                    case HTMLPropertyEnum.IEValue:
                        this.IEValue = htmlCommon.GetHTMLValue();
                        break;
                    case HTMLPropertyEnum.IEType:
                        this.IEType = htmlCommon.GetHTMLType();
                        break;
                    case HTMLPropertyEnum.IEAlt:
                        this.IEAlt = htmlCommon.GetHTMLAlt();
                        break;
                    case HTMLPropertyEnum.IEClassId:
                        this.IEClassId = htmlCommon.GetHTMLClassID();
                        break;
                    case HTMLPropertyEnum.IETitle:
                        this.IETitle = htmlCommon.GetHTMLTitle();
                        break;
                    case HTMLPropertyEnum.IETagIndex:
                        if (this.RequestAction == HTMlRequestAction.CAPTURE_OBJECT_NODE || this.RequestAction == HTMlRequestAction.CREATE_AVATAR)
                            this.IETagIndex = htmlCommon.GetHTMLTagIndexRecording(this.ControlElement);
                        else
                            this.IETagIndex = htmlCommon.GetHTMLTagIndex();
                        break;
                    case HTMLPropertyEnum.IELeft:
                        this.IELeft = Math.round(htmlCommon.GetHTMLIELeft(0, false), 0);
                        break;
                    case HTMLPropertyEnum.IETop:
                        this.IETop = Math.round(htmlCommon.GetHTMLIETop(0, false), 0);
                        break;
                    case HTMLPropertyEnum.IEHeight:
                        this.IEHeight = Math.round(htmlCommon.GetHTMLHeight(), 0);
                        break;
                    case HTMLPropertyEnum.IEWidth:
                        this.IEWidth = Math.round(htmlCommon.GetHTMLWidth(), 0);
                        break;
                    case HTMLPropertyEnum.IEHasFrame:
                        this.IEHasFrame = htmlCommon.GETHasFrame();
                        break;
                    case HTMLPropertyEnum.IEHref:
                        this.IEHref = htmlCommon.GetHTMLHref();
                        break;
                    case HTMLPropertyEnum.DOMXPath:
                        if (isConsiderDOMXPathAndPath)
                        {
                            this.DOMXPath = htmlCommon.GetDOMXPath();
                        } else {
                            this.DOMXPath = String.Empty;
                        }

                       break;
                    case HTMLPropertyEnum.InnerHTML:
                        this.InnerHTML = htmlCommon.GetInnerHTML();
                        break;
                    case HTMLPropertyEnum.OuterHTML:
                        this.OuterHTML = htmlCommon.GetOuterHTML();
                        break;
                    case HTMLPropertyEnum.Path:
                        if (isConsiderDOMXPathAndPath) {
                            if (!HTMLCommon._isIE8()
                            && (this.RequestAction == HTMlRequestAction.CAPTURE_OBJECT_NODE || this.RequestAction == HTMlRequestAction.SEARCH_OBJECT || this.RequestAction == HTMlRequestAction.PLAY_OBJECT_ACTION))
                                this.Path = new HTMLObjectPath().Create(this.ControlElement);
                        } else {
                            this.Path = String.Empty;
                        }
                        break;
                }
            }

        if (this.IEHasFrame) {
            this.IEFrameSrc = htmlCommon.GetFrameSource();
            this.IEFrameName = htmlCommon.GetFrameName();
            this.FrameDOMXPath = htmlCommon.GetFrameDOMXPath();
        }

        if (this.isList(this.IETag.toLowerCase())) {
            htmlCommon.GetItemCollection(this.ControlElement);
            this.ItemCollection = htmlCommon.ReplaceSpacialCharacter(this.GetStringFromItemCollection(htmlCommon.itemPropertiesObj));
        }
        try {
            var rect = this.ControlElement.getBoundingClientRect();
            this.Left = parseInt(rect.left) + DomLocation[0];
            this.Top = parseInt(rect.top) + DomLocation[1];
        }
        catch (e) {
            AALogger('HTMLObject', 'FillPropertiesBasedOnSearchCriteria', getErrorMessage(e));
            this.Left = htmlCommon.GetHTMLIELeft(0, true) + DomLocation[0];
            this.Top = htmlCommon.GetHTMLIETop(0, true) + DomLocation[1];
        }

        this.Left = Math.round(this.Left, 0);
        this.Top = Math.round(this.Top, 0);

        if (this.IsVisibleSupported)
            this.IsVisible = getIsVisibleValue(htmlObject);
            return true;

    }

    function fillAllProperties(htmlObject) {

        var htmlCommon = new HTMLCommon(htmlObject.ControlElement);
        htmlObject.Name = htmlCommon.GetName();
        htmlObject.Role = htmlCommon.GetRole();
        htmlObject.States = htmlCommon.GetStates();
        htmlObject.IEParent = htmlCommon.GetHTMLOffsetParent();
        htmlObject.IEID = htmlCommon.GetHTMLID();
        htmlObject.IEName = htmlCommon.GetHTMLName();
        htmlObject.IETag = htmlCommon.GetHTMLTag();
        htmlObject.IEClass = htmlCommon.GetHTMLClass();
        htmlObject.IEInnerText = htmlCommon.GetHTMLInnerText();
        htmlObject.IESourceIndex = htmlCommon.GetHTMLSourceIndex();
        htmlObject.IEValue = htmlCommon.GetHTMLValue();
        htmlObject.IEType = htmlCommon.GetHTMLType();
        htmlObject.IEAlt = htmlCommon.GetHTMLAlt();
        htmlObject.IEClassId = htmlCommon.GetHTMLClassID();
        htmlObject.IETitle = htmlCommon.GetHTMLTitle();
        if (htmlObject.RequestAction == HTMlRequestAction.CAPTURE_OBJECT_NODE || htmlObject.RequestAction == HTMlRequestAction.CREATE_AVATAR)
            htmlObject.IETagIndex = htmlCommon.GetHTMLTagIndexRecording(htmlObject.ControlElement);
        else
            htmlObject.IETagIndex = htmlCommon.GetHTMLTagIndex();

        htmlObject.IELeft = Math.round(htmlCommon.GetHTMLIELeft(0, false), 0);
        htmlObject.IETop = Math.round(htmlCommon.GetHTMLIETop(0, false), 0);
        if ((HTMLCommon.GetBrowserName() == HTMLBrowsers.Chrome) || (HTMLCommon.GetBrowserName() == HTMLBrowsers.Firefox)) {
            htmlObject.IEHeight = Math.round(htmlCommon.GetHTMLHeight() * window.devicePixelRatio);
            htmlObject.IEWidth = Math.round(htmlCommon.GetHTMLWidth() * window.devicePixelRatio);
        }
        else {
            htmlObject.IEHeight = Math.round(htmlCommon.GetHTMLHeight(), 0);
            htmlObject.IEWidth = Math.round(htmlCommon.GetHTMLWidth(), 0);
        }

        htmlObject.IEHasFrame = htmlCommon.GETHasFrame();
        htmlObject.IEHref = htmlCommon.GetHTMLHref();
        htmlObject.DOMXPath = htmlCommon.GetDOMXPath();
        htmlObject.InnerHTML = htmlCommon.GetInnerHTML();
        htmlObject.OuterHTML = htmlCommon.GetOuterHTML();
        try {
            if (!HTMLCommon._isIE8()
                && (htmlObject.RequestAction == HTMlRequestAction.CAPTURE_OBJECT_NODE || htmlObject.RequestAction == HTMlRequestAction.SEARCH_OBJECT || htmlObject.RequestAction == HTMlRequestAction.PLAY_OBJECT_ACTION))
                htmlObject.Path = new HTMLObjectPath().Create(htmlObject.ControlElement);
        }
        catch (e)
        {
            AALogger('HTMLObject', 'FillProperty', getErrorMessage(e));
        }

        if (htmlObject.IEHasFrame) {
            htmlObject.IEFrameSrc = htmlCommon.GetFrameSource();
            htmlObject.IEFrameName = htmlCommon.GetFrameName();
            htmlObject.FrameDOMXPath = htmlCommon.GetFrameDOMXPath();
        }

        if (htmlObject.isList(htmlObject.IETag.toLowerCase())) {
            htmlCommon.GetItemCollection(htmlObject.ControlElement);
            htmlObject.ItemCollection = htmlCommon.ReplaceSpacialCharacter(htmlObject.GetStringFromItemCollection(htmlCommon.itemPropertiesObj));
        }
        try {
            var rect = htmlObject.ControlElement.getBoundingClientRect();
            if ((HTMLCommon.GetBrowserName() == HTMLBrowsers.Chrome) || (HTMLCommon.GetBrowserName() == HTMLBrowsers.Firefox)) {
                htmlObject.Left = Math.round(Math.round(parseInt(rect.left) * window.devicePixelRatio) + DomLocation[0]);
                htmlObject.Top = Math.round(Math.round(parseInt(rect.top) * window.devicePixelRatio) + DomLocation[1]);
            }
            else {
                htmlObject.Left = parseInt(rect.left) + DomLocation[0];
                htmlObject.Top = parseInt(rect.top) + DomLocation[1];
            }

        }
        catch (e) {
            AALogger('HTMLObject', 'FillProperty', getErrorMessage(e));
            if ((HTMLCommon.GetBrowserName() == HTMLBrowsers.Chrome) || (HTMLCommon.GetBrowserName() == HTMLBrowsers.Firefox)) {
                htmlObject.Left = Math.round(Math.round(htmlCommon.GetHTMLIELeft(0, true) * window.devicePixelRatio) + DomLocation[0]);
                htmlObject.Top = Math.round(Math.round(htmlCommon.GetHTMLIETop(0, true) * window.devicePixelRatio) + DomLocation[1]);
            }
            else {
                htmlObject.Left = htmlCommon.GetHTMLIELeft(0, true) + DomLocation[0];
                htmlObject.Top = htmlCommon.GetHTMLIETop(0, true) + DomLocation[1];
            }
        }

        htmlObject.Left = Math.round(htmlObject.Left, 0);
        htmlObject.Top = Math.round(htmlObject.Top, 0);

        if (htmlObject.IsVisibleSupported)
            htmlObject.IsVisible = getIsVisibleValue(htmlObject);
    }

    function getIsVisibleValue(htmlObject) {
        if (!IsElementOnScreen(htmlObject.ControlElement) || isHidden(htmlObject.ControlElement))
            return false;

        return true;
    }

    function isHidden(element) {
        if (!HTMLCommon.IsVisible(element) || HTMLCommon.IsAriaHidden(element))
            return true;

        return false;
    }

    function fillPropertiesForDetectObjectNode(htmlObject) {

        var htmlCommon = new HTMLCommon(htmlObject.ControlElement);

        htmlObject.Role = htmlCommon.GetRole();
        htmlObject.Name = htmlCommon.GetName();
        htmlObject.States = htmlCommon.GetStates();
        htmlObject.IEName = htmlCommon.GetHTMLName();
        if (String.IsNullOrEmpty(htmlObject.IEName)) {
            htmlObject.IEInnerText = htmlCommon.GetHTMLInnerText();
        }

        htmlObject.IEValue = htmlCommon.GetHTMLValue();
        fillDimensionsForElement(htmlObject, htmlCommon, htmlObject.ControlElement);

    }

    function fillDimensionsForElement(htmlObject, htmlCommon, targetElement) {
        if ((HTMLCommon.GetBrowserName() == HTMLBrowsers.Chrome) || (HTMLCommon.GetBrowserName() == HTMLBrowsers.Firefox)) {
            htmlObject.IEHeight = Math.round(htmlCommon.GetHTMLHeight() * window.devicePixelRatio);
            htmlObject.IEWidth = Math.round(htmlCommon.GetHTMLWidth() * window.devicePixelRatio);
        }
        else {
            htmlObject.IEHeight = htmlCommon.GetHTMLHeight();
            htmlObject.IEWidth = htmlCommon.GetHTMLWidth();
        }

        htmlObject.IEHasFrame = htmlCommon.GETHasFrame();
        if (htmlObject.IEHasFrame) {
            htmlObject.IEFrameSrc = htmlCommon.GetFrameSource();
            htmlObject.IEFrameName = htmlCommon.GetFrameName();
        }

        try {
            var rect = targetElement.getBoundingClientRect();
            if ((HTMLCommon.GetBrowserName() == HTMLBrowsers.Chrome) || (HTMLCommon.GetBrowserName() == HTMLBrowsers.Firefox)) {
                htmlObject.Left = Math.round(Math.round(parseInt(rect.left) * window.devicePixelRatio) + DomLocation[0]);
                htmlObject.Top = Math.round(Math.round(parseInt(rect.top) * window.devicePixelRatio) + DomLocation[1]);
            }
            else {
                htmlObject.Left = parseInt(rect.left) + DomLocation[0];
                htmlObject.Top = parseInt(rect.top) + DomLocation[1];
            }
        }
        catch (e) {
            AALogger('HTMLObject', 'FillProperty', getErrorMessage(e));
            if ((HTMLCommon.GetBrowserName() == HTMLBrowsers.Chrome) || (HTMLCommon.GetBrowserName() == HTMLBrowsers.Firefox)) {
                htmlObject.Left = Math.round(Math.round(htmlCommon.GetHTMLIELeft(0, true) * window.devicePixelRatio) + DomLocation[0]);
                htmlObject.Top = Math.round(Math.round(htmlCommon.GetHTMLIETop(0, true) * window.devicePixelRatio) + DomLocation[1]);
            }
            else {
                htmlObject.Left = Math.round(htmlCommon.GetHTMLIELeft(0, true) + DomLocation[0]);
                htmlObject.Top = Math.round(htmlCommon.GetHTMLIETop(0, true) + DomLocation[1]);
            }
        }
    }
    this.FillDimensionsWithElement = function (targetElement) {
        fillDimensionsForElement(this, new HTMLCommon(targetElement), targetElement);
    }

    this.SetInnerHTMLAsName = function () {
        var htmlCommon = new HTMLCommon(this.ControlElement);
        this.Name = htmlCommon.GetInnerHTML();
    }

    this.FillProperty = function () {
        if (this.ControlElement == null)
            return;

        if (this.RequestAction == HTMlRequestAction.DETECT_OBJECT_NODE) {
            fillPropertiesForDetectObjectNode(this);
        } else {
            fillAllProperties(this);
        }
    }

    this.isList = function (tagName) {
        if (tagName == "select" || tagName == "ol" || tagName == "ul")
            return true;

        return false;
    }
    this.GetStringFromItemCollection = function (stringArray) {
        try {
            var ItemCollectionSTR = '';
            for (i = 0; i < stringArray.length; i++) {
                if (stringArray[i] != '') {
                    if (i < stringArray.length - 1)
                        ItemCollectionSTR = ItemCollectionSTR + stringArray[i] + ITEM_SEPARATOR;
                    else
                        ItemCollectionSTR = ItemCollectionSTR + stringArray[i];
                }
            }
            return ItemCollectionSTR;
        }
        catch (e) {
            AALogger('HTMLObject', 'GetStringFromItemCollection', getErrorMessage(e));
            return ItemCollectionSTR;
        }

    }

    this.PropertyInXML = function () {
        var htmlCommon = new HTMLCommon(null);
        var ObjectXML = "<Prop Nam='UniqueID' Val=''/>";
        ObjectXML = ObjectXML + "<Prop Nam='ID' Val=''/>";
        ObjectXML = ObjectXML + "<Prop Nam='Name' Val='" + htmlCommon.ReplaceSpacialCharacter(this.Name) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='Value' Val=''/>";
        ObjectXML = ObjectXML + "<Prop Nam='Class' Val=''/>";
        ObjectXML = ObjectXML + "<Prop Nam='Parent' Val=''/>";
        ObjectXML = ObjectXML + "<Prop Nam='WindowTitle' Val=''/>";
        ObjectXML = ObjectXML + "<Prop Nam='Role' Val='" + this.Role + "'/>";

        ObjectXML = ObjectXML + "<Prop Nam='Path' Val='" + this.Path + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='Index' Val='0'/>";
        ObjectXML = ObjectXML + "<Prop Nam='Left' Val='" + htmlCommon.ReplaceSpacialCharacter(htmlCommon.ConvertNumberToString(this.Left)) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='Top' Val='" + htmlCommon.ReplaceSpacialCharacter(htmlCommon.ConvertNumberToString(this.Top)) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='Width' Val='" + htmlCommon.ReplaceSpacialCharacter(htmlCommon.ConvertNumberToString(this.IEWidth)) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='Height' Val='" + htmlCommon.ReplaceSpacialCharacter(htmlCommon.ConvertNumberToString(this.IEHeight)) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='ClickX' Val='0'/>";
        ObjectXML = ObjectXML + "<Prop Nam='ClickY' Val='0'/>";
        ObjectXML = ObjectXML + "<Prop Nam='Description' Val=''/>";
        ObjectXML = ObjectXML + "<Prop Nam='States' Val='" + htmlCommon.ReplaceSpacialCharacter(this.States) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='DefaultAction' Val=''/>";

        ObjectXML = ObjectXML + "<Prop Nam='DOMXPath' Val='" + htmlCommon.ReplaceSpacialCharacter(this.DOMXPath.toString()) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='IEID' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IEID) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='IEName' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IEName) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='IEAlt' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IEAlt.toString()) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='IETag' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IETag) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='IEClass' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IEClass) + "'/>";

        ObjectXML = ObjectXML + "<Prop Nam='IEInnerText' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IEInnerText) + "'/>";
        //ObjectXML = ObjectXML + "<Prop Nam='IEInnerText' Val=''/>";
        ObjectXML = ObjectXML + "<Prop Nam='IESourceIndex' Val='" + htmlCommon.ReplaceSpacialCharacter(htmlCommon.ConvertNumberToString(this.IESourceIndex)) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='IEHref' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IEHref) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='IEType' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IEType) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='IEValue' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IEValue) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='IEClassId' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IEClassId) + "'/>"; // Additional
        ObjectXML = ObjectXML + "<Prop Nam='IETitle' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IETitle) + "'/>";

        ObjectXML = ObjectXML + "<Prop Nam='IEHeight' Val='" + htmlCommon.ReplaceSpacialCharacter(htmlCommon.ConvertNumberToString(this.IEHeight)) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='IEWidth' Val='" + htmlCommon.ReplaceSpacialCharacter(htmlCommon.ConvertNumberToString(this.IEWidth)) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='IETagIndex' Val='" + htmlCommon.ReplaceSpacialCharacter(htmlCommon.ConvertNumberToString(this.IETagIndex)) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='IETop' Val='" + htmlCommon.ReplaceSpacialCharacter(htmlCommon.ConvertNumberToString(this.IETop)) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='IELeft' Val='" + htmlCommon.ReplaceSpacialCharacter(htmlCommon.ConvertNumberToString(this.IELeft)) + "'/>";

        ObjectXML = ObjectXML + "<Prop Nam='IEHasFrame' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IEHasFrame) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='IEFrameSrc' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IEFrameSrc) + "'/>"; // Additional
        ObjectXML = ObjectXML + "<Prop Nam='IEFrameName' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IEFrameName) + "'/>"; // Additional
        ObjectXML = ObjectXML + "<Prop Nam='IEFramePath' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IEFramePath) + "'/>"; // Additional
        ObjectXML = ObjectXML + "<Prop Nam='FrameDOMXPath' Val='" + htmlCommon.ReplaceSpacialCharacter(this.FrameDOMXPath) + "'/>"; // Additional
        if (this.Role == 'ComboBox' || this.Role == 'ListView')
            ObjectXML = ObjectXML + "<Prop Nam='ItemCollection' Val='" + htmlCommon.ReplaceSpacialCharacter(this.ItemCollection) + "'/>";
        if (this.RequestAction == HTMlRequestAction.SEARCH_OBJECT || this.RequestAction == HTMlRequestAction.PLAY_OBJECT_ACTION)
            ObjectXML = ObjectXML + "<Prop Nam='IEParent' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IEParent) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='innerHTML' Val='" + htmlCommon.ReplaceSpacialCharacter(this.InnerHTML) + "'/>";
        ObjectXML = ObjectXML + "<Prop Nam='outerHTML' Val='" + htmlCommon.ReplaceSpacialCharacter(this.OuterHTML) + "'/>";
        //ObjectXML = ObjectXML + "<Prop Nam='innerHTML' Val=''/>";
        //ObjectXML = ObjectXML + "<Prop Nam='outerHTML' Val=''/>";
        ObjectXML = ObjectXML + "<Prop Nam='IsVisible' Val='" + htmlCommon.ReplaceSpacialCharacter(this.IsVisible) + "'/>";

        return ObjectXML;
    }

    this.ToString = function () {
        var ObjectXML = HTML_OBJECT_START;
        if (this.ControlElement != null) {
            ObjectXML = ObjectXML + this.PropertyInXML();
        }

        ObjectXML = ObjectXML + HTML_OBJECT_END;
        return ObjectXML;
    }

    this.CompareProperties = function (HtmlSearchedObject, HtmlSearchCriteria) {
        if (HtmlSearchedObject == null)
            return false;

        if (HtmlSearchCriteria == null)
            return true;

        var searchPropertyValue = "";
        var thisPropertyValue = "";
        for (var index = 0; index < HtmlSearchCriteria.length; index++) {
            switch (HtmlSearchCriteria[index]) {
                case HTMLPropertyEnum.IEClass:
                    searchPropertyValue = HtmlSearchedObject.IEClass;
                    thisPropertyValue = this.IEClass;
                    break;
                case HTMLPropertyEnum.IEHeight:
                    searchPropertyValue = HtmlSearchedObject.IEHeight.toString();
                    thisPropertyValue = this.IEHeight.toString();
                    break;
                case HTMLPropertyEnum.IEHref:
                    searchPropertyValue = HtmlSearchedObject.IEHref;
                    thisPropertyValue = this.IEHref;
                    break;
                case HTMLPropertyEnum.IEID:
                    searchPropertyValue = HtmlSearchedObject.IEID;
                    thisPropertyValue = this.IEID;
                    break;
                case HTMLPropertyEnum.IELeft:
                    searchPropertyValue = HtmlSearchedObject.IELeft.toString();
                    thisPropertyValue = this.IELeft.toString();
                    break;
                case HTMLPropertyEnum.IEName:
                    searchPropertyValue = HtmlSearchedObject.IEName.toString();
                    thisPropertyValue = this.IEName.toString();
                    break;
                case HTMLPropertyEnum.IEParent:
                    searchPropertyValue = HtmlSearchedObject.IEParent;
                    thisPropertyValue = this.IEParent;
                    break;
                case HTMLPropertyEnum.IESourceIndex:
                    searchPropertyValue = HtmlSearchedObject.IESourceIndex.toString();
                    thisPropertyValue = this.IESourceIndex.toString();
                    break;
                case HTMLPropertyEnum.IETag:
                    searchPropertyValue = HtmlSearchedObject.IETag;
                    thisPropertyValue = this.IETag;
                    break;
                case HTMLPropertyEnum.IETitle:
                    searchPropertyValue = HtmlSearchedObject.IETitle;
                    thisPropertyValue = this.IETitle;
                    break;
                case HTMLPropertyEnum.IETop:
                    searchPropertyValue = HtmlSearchedObject.IETop.toString();
                    thisPropertyValue = this.IETop.toString();
                    break;
                case HTMLPropertyEnum.IEType:
                    searchPropertyValue = HtmlSearchedObject.IEType;
                    thisPropertyValue = this.IEType;
                    break;
                case HTMLPropertyEnum.IEValue:
                    searchPropertyValue = HtmlSearchedObject.IEValue;
                    thisPropertyValue = this.IEValue;
                    break;
                case HTMLPropertyEnum.IEWidth:
                    searchPropertyValue = HtmlSearchedObject.IEWidth.toString();
                    thisPropertyValue = this.IEWidth.toString();
                    break;
                case HTMLPropertyEnum.IEInnerText:
                    searchPropertyValue = HtmlSearchedObject.IEInnerText;
                    thisPropertyValue = this.IEInnerText;
                    try {
                        searchPropertyValue = HtmlSearchedObject.IEInnerText.toLowerCase();
                        thisPropertyValue = this.IEInnerText.toLowerCase();
                    }
                    catch (e)
                    { AALogger('HTMLObject', 'CompareProperties', getErrorMessage(e)); }
                    break;
                case HTMLPropertyEnum.InnerHTML:
                    searchPropertyValue = HtmlSearchedObject.InnerHTML;
                    thisPropertyValue = this.InnerHTML;
                    break;                    
                case HTMLPropertyEnum.OuterHTML:
                    searchPropertyValue = HtmlSearchedObject.OuterHTML;
                    thisPropertyValue = this.OuterHTML;
                    break;                
                case HTMLPropertyEnum.IsVisible:                    
                    searchPropertyValue = getIsVisibleValue(HtmlSearchedObject).toString();                        
                    thisPropertyValue = this.IsVisible.toString();		                                                          
                    break;                        
                case HTMLPropertyEnum.DOMXPath:
                    continue;                
            }
            thisPropertyValue = thisPropertyValue.replace(/^\s+|\s+$/g, '');
            searchPropertyValue = searchPropertyValue.replace(/^\s+|\s+$/g, '');
            if (thisPropertyValue.toString() != "" && thisPropertyValue.toString().indexOf("*") != -1) {
                if (!matchWildcards(searchPropertyValue.toString(), thisPropertyValue.toString()))
                    return false;
            }
            else {
                if (replaceAndMatch(searchPropertyValue, thisPropertyValue) == false)
                    return false;
            }
        }
        return true;
    }

    function replaceAndMatch(searchString, thisString) {
        searchString = searchString.replace(/(\r\n|\n|\r)/gm, "");
        thisString = thisString.replace(/(\r\n|\n|\r)/gm, "");
        if (searchString.toString() == thisString.toString())
            return true;
        else
            return false;
    }

    function matchWildcards(string, searchTerm) {
        string = string.replace(/(\r\n|\n|\r)/gm, "");
        searchTerm = searchTerm.replace(/(\r\n|\n|\r)/gm, "");
        string = string.replace("&", "");
        searchTerm = searchTerm.replace("&", "");
        var regexp = new String();
        regexp = searchTerm.replace(
            new RegExp("([{}\(\)\^$&.\/\+\|\[\\\\]|\]|\-)", "g"), "\\$1");
        regexp = regexp.replace(new RegExp("([\*\?])", "g"), ".$1");
        regexp = "^" + regexp + "$";

        return (string.search(regexp) >= 0 ? true : false);

    }
}
"";
