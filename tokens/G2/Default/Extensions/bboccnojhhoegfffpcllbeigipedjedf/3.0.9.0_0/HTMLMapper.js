function generateElementMap(htmlElement, attrMap) {
    var elementAttributesMap = {};
    var htmlCommon = new HTMLCommon(htmlElement);

    for (let criterion in attrMap) {
        switch (criterion) {
            case HTMLSelectionCriterion.DOMXPath: {
                elementAttributesMap[HTMLSelectionCriterion.DOMXPath] = htmlCommon.GetDOMXPath();
                break;
            }
            case HTMLSelectionCriterion.HTMLTag: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLTag] = htmlCommon.GetHTMLTag();
                break;
            }
            case HTMLSelectionCriterion.HTMLID: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLID] = htmlCommon.GetHTMLID();
                break;
            }
            case HTMLSelectionCriterion.HTMLType: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLType] = htmlCommon.GetHTMLType();
                break;
            }
            case HTMLSelectionCriterion.Path: {
                // If element is at root level, the Create method will return integer value however selection criteria will return string always, this will generate differet strings when stringify
                // E.g. HTML path can be simply -1 when its first control in the <body> tag. when returned as it is, it will be casted as integer as compared to other controls for which generally path
                // is composed as pipe separated integers i.e. "4|2|1|1|1|-1|6|-3|2|4|1|1|1|2|1|-1|1" for normal textbox inside well designed Salseforce page.
                const path = new HTMLObjectPath().Create(htmlElement);
                elementAttributesMap[HTMLSelectionCriterion.Path] = path.toString();
                break;
            }
            case HTMLSelectionCriterion.HTMLName: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLName] = htmlCommon.GetHTMLName();
                break;
            }
            case HTMLSelectionCriterion.HTMLHref: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLHref] = htmlCommon.GetHTMLHref();
                break;
            }
            case HTMLSelectionCriterion.HTMLInnerText: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLInnerText] = htmlCommon.GetHTMLInnerText();
                break;
            }
            case HTMLSelectionCriterion.HTMLFrameName: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLFrameName] = htmlCommon.GetFrameName();
                break;
            }
            case HTMLSelectionCriterion.OuterHTML: {
                elementAttributesMap[HTMLSelectionCriterion.outerHTML] = htmlCommon.GetOuterHTML();
                break;
            }
            case HTMLSelectionCriterion.HTMLClass: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLClass] = htmlCommon.GetHTMLClass();
                break;
            }
            case HTMLSelectionCriterion.HTMLSourceIndex: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLSourceIndex] = htmlCommon.GetHTMLSourceIndex();
                break;
            }
            case HTMLSelectionCriterion.IsVisible: {
                elementAttributesMap[HTMLSelectionCriterion.IsVisible] = HTMLCommon.IsVisible(htmlElement);
                break;
            }
            case HTMLSelectionCriterion.Role: {
                elementAttributesMap[HTMLSelectionCriterion.Role] = htmlCommon.GetRole();
                break;
            }
            case HTMLSelectionCriterion.InnerHTML: {
                elementAttributesMap[HTMLSelectionCriterion.InnerHTML] = htmlCommon.GetInnerHTML();
                break;
            }
            case HTMLSelectionCriterion.Left: {
                elementAttributesMap[HTMLSelectionCriterion.Left] = Math.round(htmlCommon.GetHTMLIELeft(0, false), 0);
                break;
            }
            case HTMLSelectionCriterion.HTMLTop: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLTop] = Math.round(htmlCommon.GetHTMLIETop(0, false), 0);
                break;
            }
            case HTMLSelectionCriterion.HTMLLeft: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLLeft] = Math.round(htmlCommon.GetHTMLIELeft(0, false), 0);
                break;
            }
            case HTMLSelectionCriterion.Parent: {
                elementAttributesMap[HTMLSelectionCriterion.Parent] = htmlCommon.GetHTMLOffsetParent();
                break;
            }
            case HTMLSelectionCriterion.Index: {
                elementAttributesMap[HTMLSelectionCriterion.Index] = htmlCommon.GetHTMLTagIndex();
                break;
            }
            case HTMLSelectionCriterion.Name: {
                elementAttributesMap[HTMLSelectionCriterion.Name] = htmlCommon.GetName();
                break;
            }
            case HTMLSelectionCriterion.States: {
                elementAttributesMap[HTMLSelectionCriterion.States] = htmlCommon.GetStates();
                break;
            }
            case HTMLSelectionCriterion.HTMLAlt: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLAlt] = htmlCommon.GetHTMLAlt();
                break;
            }
            case HTMLSelectionCriterion.Height: {
                elementAttributesMap[HTMLSelectionCriterion.Height] = Math.round(htmlCommon.GetHTMLHeight() * window.devicePixelRatio);;
                break;
            }
            case HTMLSelectionCriterion.Width: {
                elementAttributesMap[HTMLSelectionCriterion.Width] = Math.round(htmlCommon.GetHTMLWidth() * window.devicePixelRatio);
                break;
            }
            case HTMLSelectionCriterion.HTMLHeight: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLHeight] = Math.round(htmlCommon.GetHTMLHeight() * window.devicePixelRatio);;
                break;
            }
            case HTMLSelectionCriterion.HTMLTagIndex: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLTagIndex] = htmlCommon.GetHTMLTagIndexRecording(htmlElement);
                break;
            }
            case HTMLSelectionCriterion.Top: {
                elementAttributesMap[HTMLSelectionCriterion.Top] = Math.round(htmlCommon.GetHTMLIETop(0, false), 0);
                break;
            }
            case HTMLSelectionCriterion.HTMLClassId: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLClassId] = htmlCommon.GetHTMLClassID();
                break;
            }
            case HTMLSelectionCriterion.HTMLWidth: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLWidth] = Math.round(htmlCommon.GetHTMLWidth() * window.devicePixelRatio);
                break;
            }
            case HTMLSelectionCriterion.Value: {
                elementAttributesMap[HTMLSelectionCriterion.Value] = htmlCommon.GetHTMLValue();
                break;
            }
            case HTMLSelectionCriterion.HTMLFrameSrc: {
                elementAttributesMap[HTMLSelectionCriterion.HTMLFrameSrc] = htmlCommon.GetFrameSource();
                break;
            }
            case HTMLSelectionCriterion.HTMLValue:
                elementAttributesMap[HTMLSelectionCriterion.HTMLValue] = htmlCommon.GetHTMLValue();
            case HTMLSelectionCriterion.HTMLHasFrame:
            case HTMLSelectionCriterion.HTMLTitle:
            case HTMLSelectionCriterion.Description:
            case HTMLSelectionCriterion.WindowTitle:
            case HTMLSelectionCriterion.DefaultAction:
            case HTMLSelectionCriterion.ItemName:
            case HTMLSelectionCriterion.HTMLFramePath:
            case HTMLSelectionCriterion.ID:
            case HTMLSelectionCriterion.Class:
            case HTMLSelectionCriterion.ItemValue:
            default: {
                break;
            }
        }
    }
    return elementAttributesMap;
}
