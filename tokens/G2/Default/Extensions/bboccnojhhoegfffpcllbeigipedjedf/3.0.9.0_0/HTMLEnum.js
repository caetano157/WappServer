//Copyright (c) 2019 Automation Anywhere.
// All rights reserved.
//
// This software is the proprietary information of Automation Anywhere.
//You shall use it only in accordance with the terms of the license agreement
//you entered into with Automation Anywhere.

var PROP_IEFRAME = "iframe";
var PROP_FRAME = "frame";
var PROP_TABLE = "table";
var UNDEFINED = "undefined";
var ListItem = "ListItem";
var OPTGROUP = "optgroup";

var PLUGINCOMMAND = "PluginCommand";
var PROP = "Prop";
var TYP = "Typ";
var NAM = "Nam";
var VAL = "Val";
var BODY = "body";
var OBJECT = "Object";

var CONTROLTYPE_RADIO = "radio";
var CONTROLTYPE_CHECKBOX = "checkbox";

var STATUS_SELECTED = "Selected";
var STATUS_DESELECTED = "Deselected";
var STATUS_CHECKED = "Checked";
var STATUS_UNCHECKED = "Unchecked";
var STATUS_INTERMEDIATE = "Intermediate";
var ITEM_SEPARATOR = "<sep>";
var ITEMS_START = "<Items>";
var ITEM_START = "<Item Name = '";
var ITEMS_END = "</Items>";
var END_TAG = "'/>";

var TAG_TBODY = "tbody";
var TAG_THEAD = "thead";
var TAG_TFOOT = "tfoot";
var TAG_ROW = "tr";
var CROSSDOMAIN_IFRAME_NOTAVAILABLE = "CrossDomainFrameIndexNotavailable";

var HTMLBrowserAction = {
    CheckPageExists: "CheckPageExists",
    NavigateURL: "NavigateURL",
    NewWindow: "NewWindow",
    Close: "Close",
    NewTab: "NewTab",
    GetCurrentTab: "GetCurrentTab",
    GetURL: "GetURL"
};

var HTMLBrowsers = {
    Chrome: "Chrome",
    Firefox: "Firefox",
    Edge: "Edge"
};

var HTMLPropertyEnum = {
    IEParent: "IEParent",
    IELeft: "IELeft",
    IETop: "IETop",
    IEWidth: "IEWidth",
    IEHeight: "IEHeight",
    IEID: "IEID",
    IEName: "IEName",
    IETag: "IETag",
    IEClass: "IEClass",
    IESourceIndex: "IESourceIndex",
    IEType: "IEType",
    IETagIndex: "IETagIndex",
    IEHasFrame: "IEHasFrame",
    IEHref: "IEHref",
    IETitle: "IETitle",
    IEValue: "IEValue",
    IEInnerText: "IEInnerText",
    IETableIndex: "IETableIndex",
    IEClassId: "IEClassId",
    IECollectionIndex: "IECollectionIndex",
    IsVisible:"IsVisible",
    ActionToPlay: "ActionToPlay",
    FrameIndex: "FrameIndex",
    PlayValue1: "PlayValue1",
    PlayValue2: "PlayValue2",
    PlayWait: "PlayWait",
    Name: "Name",
    ID: "ID",
    Role: "Role",
    X: "X",
    Y: "Y",
    ParentLeft: "ParentLeft",
    ParentTop: "ParentTop",
    IEFrameSrc: "IEFrameSrc",
    IEFrameName: "IEFrameName",
    IEAlt: "IEAlt",
    MozillaAPI: "@mozilla.org/appshell/window-mediator;1",
    Path: "Path", //Start [Path] [Jecky] [Date : 13/03/2013]
    DOMXPath: "DOMXPath",//Start [XPath] [Ujjval] [Date : 16/10/2013]
    ClickX: "ClickX",
    ClickY: "ClickY",
    HasSubItems: "bSubItems",
    InnerHTML: "innerHTML",
    OuterHTML: "outerHTML",
    IEFramePath: "IEFramePath",
    CaptureHiddenObjects: "CaptureHiddenObjects",
    IsVisible: "IsVisible",
    IsVisibleSupported: "IsVisibleSupported",
    IsMultiSelectionKeyDown: "IsMultiSelectionKeyDown",
    IsSecureValue: "IsSecureValue",
    IsDefaultDPI: "bDefaultDPI",
    CaptureVersion: "CaptureVersion",
    IsCrossDomainRequest:"IsCrossDomainRequest",
    FrameDOMXPath: "FrameDOMXPath",
    ControlType: "bControlType",
    CaptureVersion: "CaptureVersion"    
};

var InvalidPropertieList = [
    "ActionToPlay",
    "Path",
    "PlayValue1",
    "PlayValue2",
    "ID",
    "X",
    "Y",
    "ParentLeft",
    "ParentTop",
    "PlayWait",
    "Name",
    "Value",
    "Class",
    "Parent",
    "Role",
    "Index",
    "Left",
    "Top",
    "Width",
    "Height",
    "Description",
    "States",
    "DefaultAction",
    "IESourceIndex",
    "IsMultiSelectionKeyDown",
    "CaptureVersion"
    //"IEHasFrame",
    //"IEFrameSrc",
    //"IEFrameName"
    //"DOMXPath"
];

var HTMLControlAction = {
    Click: "Click",
    LeftClick: "LeftClick",
    RightClick: "RightClick",
    DoubleClick: "DoubleClick",
    MiddleClick: "MiddleClick",
    SetText: "SetText",
    SendKeystroke: "SendKeystroke",
    SetFocus: "SetFocus",
    GetText: "GetText",
    AppendText: "AppendText",
    Check: "Check",
    UnCheck: "UnCheck",
    SetIntermideateState: "SetIntermideateState",
    Toggle: "Toggle",
    Select: "Select",
    GetSelectedIndex: "GetSelectedIndex",
    GetSelectedText: "GetSelectedText",
    SelectItemByIndex: "SelectItemByIndex",
    SelectItemByText: "SelectItemByText",
    GetTextByIndex: "GetTextByIndex",
    GetIndexByText: "GetIndexByText",
    GetName: "GetName",
    GetValue: "GetValue",
    GetStatus: "GetStatus",
    GetProperty: "GetProperty",
    GetChildrenName: "GetChildrenName",
    GetChildrenValue: "GetChildrenValue",
    GetTotalItems: "GetTotalItems",
    GetTotalRows: "GetTotalRows",
    GetTotalColumns: "GetTotalColumns",
    GetCellByIndex: "GetCellByIndex",
    GetCellByText: "GetCellByText",
    SetCellByIndex: "SetCellByIndex",
    SetCellByText: "SetCellByText",
    ExtractToCSV: "ExtractToCSV",
    ExtractToArray: "ExtractToArray",
    Expand: "Expand",
    Collaps: "Collaps",
    GetItemObject: "GetItemObject",
    SetPosition: "SetPosition",
    SetDate: "SetDate",
    SetDateRange: "SetDateRange",
    SetMonth: "SetMonth",
    SetYear: "SetYear",
    SetValue: "SetValue",
    ClickCellByIndex: "ClickCellByIndex",
    ClickCellByText: "ClickCellByText"
};

var HTMlRequestAction = {
    PLAY_OBJECT_ACTION: "PLAY_OBJECT_ACTION",
    SEARCH_OBJECT: "SEARCH_OBJECT",
    NONE: "NONE",
    OPEN_URL: "OPEN_URL",
    GET_URL: "GET_URL",
    APPLETRECT: "APPLETRECT",
    DETECT_OBJECT_NODE: "DETECT_OBJECT_NODE",
    CAPTURE_OBJECT_NODE: "CAPTURE_OBJECT_NODE",
    CREATE_AVATAR: "CREATE_AVATAR",    
    TYPE_MAPPING: "TYPE_MAPPING",
    PAGELOADSTATUS: "PAGELOADSTATUS",
    REQFORWINHANDLE: "REQFORWINHANDLE"
};

var HTMLErrorCode = {
    None: "None",
    NullObject: "NullObject",
    NullObjectNode: "NullObjectNode",
    NullPlayObject: "NullPlayObject",
    ReadOnlyObject: "ReadOnlyObject",
    UnAvailableObject: "UnAvailableObject",
    UnKnownTechnology: "UnKnownTechnology",
    NotAllowedSecureValue: "NotAllowedSecureValue"
};

var HTMLSelectionCriterion = {
    DOMXPath: "DOMXPath",
    HTMLTag: "HTML Tag",
    WindowTitle: "WindowTitle",
    InnerHTML: "innerHTML",
    Left: "Left",
    Description: "Description",
    HTMLTop: "HTML Top",
    HTMLLeft: "HTML Left",
    Parent: "Parent",
    HTMLID: "HTML ID",
    Index: "Index",
    OuterHTML: "outerHTML",
    HTMLClass: "HTML Class",
    HTMLFrameName: "HTML FrameName",
    HTMLHasFrame: "HTML HasFrame",
    Name: "Name",
    States: "States",
    HTMLType: "HTML Type",
    HTMLFramePath: "HTML FramePath",
    HTMLInnerText: "HTML InnerText",
    HTMLAlt: "HTML Alt",
    HTMLHref: "HTML Href",
    HTMLSourceIndex: "HTML SourceIndex",
    ItemName: "ItemName",
    Height: "Height",
    ID: "ID",
    Width: "Width",
    HTMLTitle: "HTML Title",
    Path: "Path",
    HTMLHeight: "HTML Height",
    HTMLValue: "HTML Value",
    HTMLTagIndex: "HTML TagIndex",
    Role: "Role",
    Top: "Top",
    DefaultAction: "DefaultAction",
    ItemValue: "ItemValue",
    HTMLClassId: "HTML ClassId",
    HTMLWidth: "HTML Width",
    Value: "Value",
    HTMLName: "HTML Name",
    Class: "Class",
    HTMLFrameSrc: "HTML FrameSrc",
    IsVisible: "IsVisible"
};

var HTMLTriggerListenerType = {
    Document: "Document",
    Element: "Element"
};

var HTMLDocumentStatus = {
    COMPLETE: 'complete',
    INTERACTIVE: 'interactive',
    UNKNOWN: 'unknown',
    LOADING: 'loading'
};

var AlertEvents = {
    ALERT_OPEN: "AlertOpen",
    ALERT_CLOSE: "AlertClose"
}

function hasElement(array, element) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] == element) {
            return 1;
        }
    }
    return 0;
}
"";

try {
    module.exports = {
        HTMLDocumentStatus
    };
} catch (err) { }

