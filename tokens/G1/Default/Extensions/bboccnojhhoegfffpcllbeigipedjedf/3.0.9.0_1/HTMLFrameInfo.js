//Copyright (c) 2019 Automation Anywhere.
// All rights reserved.
//
// This software is the proprietary information of Automation Anywhere.
//You shall use it only in accordance with the terms of the license agreement
//you entered into with Automation Anywhere.

Convert = function () { }

Convert.ToInt = function (value) {
    return value || 0;
}

function HTMLFrameInfo(contentDocument, frame) {
    this.ContentDocument = contentDocument;
    this.FrameLocation = new Array(2);
    this.FrameName = frame != undefined ? (frame.name == undefined ? frame.document.URL : frame.name) : "";
    this.FrameID = "";
    this.HasFrame = false;
    this.Frame = frame;
    this.FrameSrc = getFrameSrc();
    this.FramePath = "";

    this.SetFrameLocation = function (pLocation) {
        try {
            if (frame != null) {
                var frameRect = getFrameLocation();

                var style = null;
                var paddingLeft = '0';
                var paddingTop = '0';

                try {
                    if (!(HTMLCommon._isIE8())) {
                        style = window.getComputedStyle(this.Frame, null);
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

                this.FrameLocation[0] = Convert.ToInt(frameRect[0]) + Convert.ToInt(pLocation[0]) + Convert.ToInt(parseInt(paddingLeft, 10));
                this.FrameLocation[1] = Convert.ToInt(frameRect[1]) + Convert.ToInt(pLocation[1]) + Convert.ToInt(parseInt(paddingTop, 10));
            } else {
                this.FrameLocation[0] = 0;
                this.FrameLocation[1] = 0;
            }

        } catch (e) {
            AALogger('HTMLFrameInfo', 'SetFrameLocation', e.message);
        }
    }

    this.ScrollIntoView = function () {
        if (frame.scrollIntoView)
            frame.scrollIntoView();
        else if (frame.frameElement && frame.frameElement.scrollIntoView)
            frame.frameElement.scrollIntoView();
        else
            AALogger("HTMLFrameInfo.ScrollIntoView, Error: Can't scroll the frame into view");
    }

    function getFrameSrc() {
        if (frame != undefined) {
            if (HTMLCommon._isIE8()) {
                if (frame.frameElement == undefined) {
                    return frame.src;
                }
                if (frame.frameElement.src != undefined) {
                    return frame.frameElement.src;
                }
            } else {
                if (frame.src != undefined) {
                    return frame.src;
                }
            }
        }
        return String.Empty;
    }
    function getFrameLocation() {
        try {
            return getFrameLocationByBoundingRect();
        } catch (e) {
            return getFrameLocationByParent();
        }
    }

    function getFrameLocationByParent() {
        var htmlCommon = new HTMLCommon(frame);
        var location = new Array(2);
        location[1] = htmlCommon.GetHTMLIETop(0, true);
        location[0] = htmlCommon.GetHTMLIELeft(0, true);
        return location;
    }

    function getFrameLocationByBoundingRect() {
        var frameRect;
        if (frame.getBoundingClientRect)
            frameRect = frame.getBoundingClientRect();
        else
            frameRect = frame.frameElement.getBoundingClientRect();
        var location = new Array(2);
        location[0] = frameRect.left;
        location[1] = frameRect.top;
        return location;
    }

    this.SetFrameName = function () {
        try {
            if (frame == null)
                this.FrameName = "";
            else if (frame.name == undefined)
                this.FrameName = "";
            else
                this.FrameName = frame.name;
        } catch (e) {
            AALogger('HTMLFrameInfo', 'SetFrameName', e.message);
        }
    }

    this.MatchFrame = function (objFrame, HtmlSearchCriteria) {
        var hasFrameProperty = false;
        for (var index = 0; index < HtmlSearchCriteria.length; index++) {
            var searchPropertyValue = "";
            var thisPropertyValue = "";

            switch (HtmlSearchCriteria[index]) {
                case HTMLPropertyEnum.IEFrameName:
                    searchPropertyValue = objFrame.FrameName;
                    thisPropertyValue = this.FrameName;
                    break;
                case HTMLPropertyEnum.IEFrameSrc:
                    searchPropertyValue = objFrame.FrameSrc;
                    thisPropertyValue = this.FrameSrc;
                    break;
                default:
                    continue;

            }

            if (!IsEqual(thisPropertyValue, searchPropertyValue))
                return false;
        }

        return true;
    }

}
"";
