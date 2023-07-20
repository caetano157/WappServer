function HTMLObjectNode(htmlElement, DomLocation, frameInfo) {
    var HTML_OBJECTNODE_START = "<PluginObjectNode>";
    var HTML_OBJECTNODE_END = "</PluginObjectNode>";

    this.objNode = new HTMLObject(DomLocation);
    this.objParent = new HTMLObject(DomLocation);
    this.objItem = new HTMLObject(DomLocation);
    this.RequestAction = HTMlRequestAction.NONE;
    this.BrowserFramework = String.Empty;
    this.FillNode = function(htmlElement){
        if(htmlElement == null)
            return;

        this.objNode.RequestAction = this.RequestAction;
        this.objNode.ControlElement = htmlElement;
        this.objNode.FillProperty(htmlElement);
        if (frameInfo && frameInfo != null) {
            this.objNode.IEHasFrame = frameInfo.HasFrame;
            if (frameInfo.HasFrame) {
                this.objNode.IEFramePath = frameInfo.FramePath;
                this.objNode.IEFrameName = frameInfo.FrameName;
                this.objNode.IEFrameSrc = frameInfo.FrameSrc;
            }
        } else {
            this.objNode.IEFramePath = String.Empty;
            this.objNode.IEFrameName = String.Empty;
            this.objNode.IEFrameSrc = String.Empty;
        }

        this.objItem.RequestAction = this.RequestAction;

        if (this.RequestAction != HTMlRequestAction.DETECT_OBJECT_NODE && this.objNode.Role == "ListView") {
            this.objItem.ControlElement = getSelectedElement(htmlElement);
            if(this.objItem.ControlElement != null) {
                this.objItem.FillProperty(this.objItem.ControlElement);
                this.objItem.SetInnerHTMLAsName();
            }
        }

    }
    this.SetFrameDOMXPath = function (framepath) {
        if (htmlElement != null) {
            if (this.objNode != null) {
                this.objNode.FrameDOMXPath = framepath;
            }
        }
    }

    function getSelectedElement(htmlElement){
        if (htmlElement==undefined||htmlElement==null)
            return null;

        for(var index = 0; index <htmlElement.children.length;index++) {
            var element = htmlElement.children[index];

            if (element == undefined || element == null)
                continue;

            if(element.selected)
                return element;
        }

        return null;
    }

    this.ToString = function () {
        var nodeString = HTML_OBJECTNODE_START;
        if (htmlElement != null) {
            if (this.objNode != null)
                nodeString += this.objNode.ToString();//0
            if (this.objParent != null)
                nodeString += this.objParent.ToString();//1
            if (this.objItem != null)
                nodeString += this.objItem.ToString();//2

            if (this.objNode.ItemCollection != String.Empty) {
                nodeString += ITEMS_START + ITEM_START + this.objNode.ItemCollection.split('&lt;sep&gt;').join(END_TAG + ITEM_START) + END_TAG + ITEMS_END;//3
            } else {
                nodeString += ITEMS_START + ITEMS_END;
            }
            if (this.objNode != null && this.objParent != null && this.objItem != null) {
                this.BrowserFramework = this.getBrowserFramework();
                nodeString = nodeString + "<Browser Nam='BrowserFramework' Val='" + this.BrowserFramework + "'/>";//3 or 4
            }
        }
        nodeString += HTML_OBJECTNODE_END;
        return nodeString;
    }

    this.getBrowserFramework = function() {
        if (PageFramework.activePageFramework) {
            return PageFramework.activePageFramework.frameworkName;
        }
        //stage 1 Check the url value to determine the page framework
        if (document.URL.indexOf(".myworkday.") > -1 || document.URL.indexOf(".workday.") > -1) {
            return "workday";
        } else if (document.URL.indexOf(".lightning.force") > -1) {
            return "lightningsalesforce";
        }
        //Stage 2 Check the class name to determine the page framework
        //PageFramework.documentFrameworkInfo value assigned through java script during page load
        if (PageFramework.documentFrameworkInfo) {
            if (PageFramework.documentFrameworkInfo.workday == true){
                return "workday";
            } else if (PageFramework.documentFrameworkInfo.sapfiori == true){
                return "sapfiori";
            } else if (PageFramework.documentFrameworkInfo.salesforce == true){
                return "lightningsalesforce";
            }
        }
    }
}
"";
