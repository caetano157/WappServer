//Copyright (c) 2019 Automation Anywhere.
// All rights reserved.
//
// This software is the proprietary information of Automation Anywhere.
//You shall use it only in accordance with the terms of the license agreement
//you entered into with Automation Anywhere.

function RequestDataParser(Xmlstring) {
    this.ActionData = new htmlActionData();
    this.ObjectToSearch = new HTMLObject();
    this.PlayWait = 0;
    this.SearchPoint= new Array(2);
    this.ParentPoint = new Array(2);
    this.RequestAction = HTMlRequestAction.NONE;
    this.SearchCriteria = new Array();
    this.FrameInfo = new HTMLFrameInfo(undefined,undefined);
    this.PluginObject = new HTMLPluginObject();
    this.CaptureHiddenObjects = true;
    this.IsVisibleSupported = false;
    this.IsMultiSelectionKeyDown = false;
    this.IsCrossDomainRequest = false;
    this.FrameDOMXPath = String.Empty;
    this.FrameIndex = String.Empty;
    this.requestClickX;
    this.requestClickY;

    this.ParseXMLString = function () {
        this.ParentPoint[0] = 0;
        this.ParentPoint[1] = 0;
        if (Xmlstring.length > 0) {
            var xmlDoc = parseXml(Xmlstring);

            var xmlAction = xmlDoc.getElementsByTagName(PLUGINCOMMAND);
            var XMLActionstr = xmlAction[0].attributes.getNamedItem(TYP).nodeValue;
            this.RequestAction = XMLActionstr;
            if (this.RequestAction != HTMlRequestAction.TYPE_MAPPING) {
                var xmlElements = xmlDoc.getElementsByTagName(PROP);
                var htmlCommon = new HTMLCommon();

                if (this.RequestAction == HTMlRequestAction.DETECT_OBJECT_NODE || this.RequestAction == HTMlRequestAction.CAPTURE_OBJECT_NODE) {
                    for (var i = 0; i < xmlElements.length; i++) {
                        var PropertyName = xmlElements[i].attributes.getNamedItem(NAM).nodeValue;
                        var PropertyValue = xmlElements[i].attributes.getNamedItem(VAL).nodeValue;
                        if (hasElement(InvalidPropertieList, PropertyName) == 0) {
                            this.SearchCriteria.push(PropertyName);
                        }
                        switch (PropertyName) {
                            case HTMLPropertyEnum.ClickX:
                                this.PluginObject.ClickX = PropertyValue * 1;
                                this.requestClickX = this.PluginObject.ClickX;
                                break;
                            case HTMLPropertyEnum.ClickY:
                                this.PluginObject.ClickY = PropertyValue * 1;
                                this.requestClickY = this.PluginObject.ClickY;
                                break;
                            case HTMLPropertyEnum.HasSubItems:
                                this.PluginObject.HasSubItems = PropertyValue;
                                break;
                            case HTMLPropertyEnum.IsDefaultDPI:
                                this.PluginObject.IsDefaultDPI = PropertyValue;
                                break;
                            case HTMLPropertyEnum.ControlType:
                                this.PluginObject.ControlType = PropertyValue;
                                break;
                            case HTMLPropertyEnum.ParentLeft:
                                this.ParentPoint[0] = parseInt(PropertyValue);
                                break;
                            case HTMLPropertyEnum.ParentTop:
                                this.ParentPoint[1] = parseInt(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IsCrossDomainRequest:
                                this.IsCrossDomainRequest = PropertyValue;
                                break;
                            case HTMLPropertyEnum.FrameDOMXPath:
                                this.FrameDOMXPath = PropertyValue;
                                break;
                            case HTMLPropertyEnum.CaptureVersion:
                                this.PluginObject.CaptureVersion = PropertyValue * 1;
                                break;                                                          
                        }
                    }
                } else {
                    // PLAY ACTION
                    for (var i = 0; i < xmlElements.length; i++) {
                        var PropertyName = xmlElements[i].attributes.getNamedItem(NAM).nodeValue;
                        var PropertyValue = xmlElements[i].attributes.getNamedItem(VAL).nodeValue;
                        if (hasElement(InvalidPropertieList, PropertyName) == 0) {
                            this.SearchCriteria.push(PropertyName);
                        }
                        switch (PropertyName) {
                            case HTMLPropertyEnum.FrameIndex:
                                this.FrameIndex = PropertyValue;
                                break;
                            case HTMLPropertyEnum.ActionToPlay:
                                this.ActionData.Action = PropertyValue;
                                break;
                            case HTMLPropertyEnum.PlayValue1:
                                this.ActionData.Value1 = htmlCommon.SetSpecialCharacter(PropertyValue);
                                break;
                            case HTMLPropertyEnum.PlayValue2:
                                this.ActionData.Value2 = htmlCommon.SetSpecialCharacter(PropertyValue);
                                break;
                            case HTMLPropertyEnum.CaptureVersion:
                                this.ActionData.CaptureVersion = PropertyValue;
                                break;
                            case HTMLPropertyEnum.IsSecureValue:
                                this.ActionData.IsSecureValue = PropertyValue;
                                break;
                            case HTMLPropertyEnum.IETop:
                                this.ObjectToSearch.IETop = PropertyValue;
                                break;
                            case HTMLPropertyEnum.IELeft:
                                this.ObjectToSearch.IELeft = PropertyValue;
                                break;
                            case HTMLPropertyEnum.IEHeight:
                                this.ObjectToSearch.IEHeight = PropertyValue;
                                break;
                            case HTMLPropertyEnum.IEWidth:
                                this.ObjectToSearch.IEWidth = PropertyValue;
                                break;
                            case HTMLPropertyEnum.IEID:
                                this.ObjectToSearch.IEID = htmlCommon.Trim(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IETagIndex:
                                this.ObjectToSearch.IETagIndex = parseInt(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IEName:
                                this.ObjectToSearch.IEName = htmlCommon.Trim(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IETag:
                                this.ObjectToSearch.IETag = htmlCommon.Trim(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IEClass:
                                this.ObjectToSearch.IEClass = htmlCommon.Trim(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IEInnerText:
                                this.ObjectToSearch.IEInnerText = htmlCommon.Trim(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IESourceIndex:
                                this.ObjectToSearch.IESourceIndex = PropertyValue;
                                break;
                            case HTMLPropertyEnum.IEValue:
                                this.ObjectToSearch.IEValue = htmlCommon.Trim(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IEType:
                                this.ObjectToSearch.IEType = htmlCommon.Trim(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IEClassId:
                                this.ObjectToSearch.IEClassId = htmlCommon.Trim(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IETitle:
                                this.ObjectToSearch.IETitle = htmlCommon.Trim(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IECollectionIndex:
                                this.ObjectToSearch.IECollectionIndex = PropertyValue;
                                break;
                            case HTMLPropertyEnum.IEHasFrame:
                                this.FrameInfo.HasFrame = PropertyValue;
                                break;
                            case HTMLPropertyEnum.IETableIndex:
                                this.ObjectToSearch.IETableIndex = parseInt(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IEHref:
                                this.ObjectToSearch.IEHref = htmlCommon.Trim(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IsVisible:
                                this.ObjectToSearch.IsVisible = htmlCommon.Trim(PropertyValue);
                                break;
                            case HTMLPropertyEnum.PlayWait:
                                this.PlayWait = parseInt(PropertyValue);
                                break;
                            case HTMLPropertyEnum.Name:
                                this.ObjectToSearch.Name = htmlCommon.Trim(PropertyValue);
                                break;
                            case HTMLPropertyEnum.ID:
                                this.ObjectToSearch.ID = htmlCommon.Trim(PropertyValue);
                                break;
                            case HTMLPropertyEnum.Role:
                                this.ObjectToSearch.Role = PropertyValue;
                                break;
                            case HTMLPropertyEnum.X:
                                this.SearchPoint[0] = parseInt(PropertyValue);
                                break;
                            case HTMLPropertyEnum.Y:
                                this.SearchPoint[1] = parseInt(PropertyValue);
                                break;
                            case HTMLPropertyEnum.ParentLeft:
                                this.ParentPoint[0] = parseInt(PropertyValue);
                                break;
                            case HTMLPropertyEnum.ParentTop:
                                this.ParentPoint[1] = parseInt(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IEFrameName:
                                this.FrameInfo.FrameName = htmlCommon.Trim(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IEFrameSrc:
                                this.FrameInfo.FrameSrc = htmlCommon.Trim(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IEFramePath:
                                this.FrameInfo.FramePath = htmlCommon.Trim(PropertyValue);
                                break;
                            //Start [Path] [Jecky] [Date : 13/03/2013]
                            case HTMLPropertyEnum.Path:
                                this.ObjectToSearch.Path = PropertyValue;
                                break;
                            //End [Path] [Jecky] [Date : 13/03/2013]
                            //Start [XPath][Ujjval][Date : 16-10-2013]
                            case HTMLPropertyEnum.DOMXPath:
                                this.ObjectToSearch.DOMXPath = PropertyValue;
                                break;
                            case HTMLPropertyEnum.InnerHTML:
                                this.ObjectToSearch.InnerHTML = PropertyValue;
                                break;
                            case HTMLPropertyEnum.OuterHTML:
                                this.ObjectToSearch.OuterHTML = PropertyValue;
                                break;
                                //End [XPath][Ujjval][Date : 16-10-2013]
                            case HTMLPropertyEnum.CaptureHiddenObjects:
                                this.CaptureHiddenObjects = Boolean.Parse(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IsVisibleSupported:
                                this.IsVisibleSupported = Boolean.Parse(PropertyValue);
                                break;
                            case HTMLPropertyEnum.IsMultiSelectionKeyDown:
                                this.IsMultiSelectionKeyDown = Boolean.Parse(PropertyValue);
                                break;
                            case HTMLPropertyEnum.ControlType:
                                this.PluginObject.ControlType = PropertyValue;
                                break;
                            case HTMLPropertyEnum.IsDefaultDPI:
                                this.PluginObject.IsDefaultDPI = PropertyValue;
                                break;
                            case HTMLPropertyEnum.FrameDOMXPath:
                                this.FrameDOMXPath = PropertyValue;
                                break;
                            case HTMLPropertyEnum.IsCrossDomainRequest:
                                this.IsCrossDomainRequest = PropertyValue;
                                break;
                        }
                    }
                }
            }
        }
    }
}

if (typeof window.DOMParser != "undefined") {
    parseXml = function (xmlStr) {
        return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
    };
} else if (typeof window.ActiveXObject != "undefined" &&
    new window.ActiveXObject("Microsoft.XMLDOM")) {
    parseXml = function (xmlStr) {
        var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = "false";
        xmlDoc.loadXML(xmlStr);
        return xmlDoc;
    };
} else {
    throw new Error("No XML parser found");
}

function htmlActionData() {
    this.Action = HTMLControlAction.GetValue;
    this.Value1 = null;
    this.Value2 = null;
    this.IsSecureValue = null;
    this.CaptureVersion = "1";
}

Boolean.Parse = function (value) {
    if (value.toLowerCase() == "true")
        return true;
    else if (value.toLowerCase() == "false")
        return false;

    throw "Invalid boolean value.";
};
"";
