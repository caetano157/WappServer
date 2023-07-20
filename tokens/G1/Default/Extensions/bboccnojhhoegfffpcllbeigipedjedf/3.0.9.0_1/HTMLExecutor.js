// Copyright (c) 2019 Automation Anywhere.
// All rights reserved.
// This software is the proprietary information of Automation Anywhere.
// You shall use it only in accordance with the terms of the license agreement
// you entered into with Automation Anywhere.

var textboxTypes = ["text", "number", "password", "textarea", "date", "datetime", "datetime-local", "email", "month", "number", "range", "search", "tel", "time", "url", "week"];
var wrapped = new Array();
var BLUR_TIMEOUT = 5000;
var requestAction = HTMlRequestAction.NONE;
var clickSelectorTargetIdx = 0;
_isIE = function () {
    return this.navigator.appName == "Microsoft Internet Explorer";
};

function simulateClickEvent(HtmlElement) {
    simulateMouseEvents(HtmlElement, "mousemove");
    simulateMouseEvents(HtmlElement, "mouseover");
    simulateMouseEvents(HtmlElement, "mousedown");
    simulateMouseEvents(HtmlElement, "mouseup");
    simulateMouseEvents(HtmlElement, "click");
}

function simulateMouseEvents(el, type) {
    var htmlDoc = el.ownerDocument;
    if (htmlDoc.createEvent) {
        var evt = htmlDoc.createEvent("MouseEvents");
        evt.initMouseEvent(type, true, true, window,
            0, 0, 0, 0, 0, false, false, false, false, 0, null);
        var allowDefault = el.dispatchEvent(evt);
    } else {
        var evt = htmlDoc.createEventObject();
        el.fireEvent('on' + type, evt);
    }
}

function HTMLExecutor(HTMLNode, requestObj) {
    var _childrenName = new Array();

    this.Execute = function (isElementInFrame) {
        try {
            fireEvent(HTMLNode, "focus");
            requestAction = requestObj.RequestAction;
            if (isClickElementInSameDomainFrame(requestObj, isElementInFrame)) {
                // Sending an additional flag to know if HTML element is in a frame to check for inline js tag case
                return ExecuteAction(HTMLNode, requestObj.ActionData.Action, requestObj.ActionData.Value1, requestObj.ActionData.Value2, requestObj.ActionData.IsSecureValue, true, undefined);
            } else if (isClickElementInCrossDomainFrame(requestObj)) {
                return ExecuteAction(HTMLNode, requestObj.ActionData.Action, requestObj.ActionData.Value1, requestObj.ActionData.Value2, requestObj.ActionData.IsSecureValue, true, requestObj.FrameIndex);
            }

            return ExecuteAction(HTMLNode, requestObj.ActionData.Action, requestObj.ActionData.Value1, requestObj.ActionData.Value2, requestObj.ActionData.IsSecureValue);
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'Execute', e.message);
            return new HTMLResult();
        }
    }

    function isClickElementInSameDomainFrame(request, isElementInFrame) {
        return request.ActionData.Action === 'Click' && isElementInFrame;
    }

    function isClickElementInCrossDomainFrame(request) {
        return request.ActionData.Action === 'Click' && request.FrameIndex;
    }

    function getSelectedIndexText(ListBoxElement, Action) {
        var index = new Array();
        try {
            if (ListBoxElement.options == undefined)
                return null;
            for (var i = 0; i < ListBoxElement.options.length; i++) {
                if (ListBoxElement.options[i].selected) {
                    if (Action == HTMLControlAction.GetSelectedIndex)
                        index.push(i + 1);
                    else
                        index.push(ListBoxElement.options[i].text);
                }
            }
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'getSelectedIndexText', e.message);
        }
        return index;
    }

    //Action Functions
    function performElementClick(HtmlElement, isElementInFrame, crossDomainFrameIndex) {
        try {
            if (HTMLCommon._isIE8()) {
                HtmlElement.click();
            } else {
                // An element like <a href="javascript:alert()"> cannot be .click()'d on in MV3 from the content script
                // and must be triggered via the "main namespace". To do this, we ask the service worker to do it for us
                // via the Debugger, by setting a selector to match against.
                // note: This does not currently wait for the response back.
                // note: if element to be clicked is in frame, we can just execute javascript to trigger click event
                if((typeof HtmlElement.href == 'string' && HtmlElement.href.toLowerCase().indexOf("javascript:") > -1) ||
                    (HtmlElement.type == 'submit' && HtmlElement.form != null && typeof HtmlElement.form.action === 'string' && HtmlElement.form.action.toLowerCase().indexOf("javascript:") > -1)
                ) {
                    AALogger.info('HTMLExecutor', 'performElementClick', 'found inline javascript in element');
                    var clickSelector = "automationanywhere-click-target";
                    var clickSelectorValue;
                    if (crossDomainFrameIndex && isElementInFrame) {
                        AALogger.info('HTMLExecutor', 'performElementClick', 'sending message to click in element in cross domain frame');
                        clickSelectorValue = "i" + clickSelectorTargetIdx++;
                        HtmlElement.setAttribute(clickSelector, clickSelectorValue);
                        var clickElementInFrameByIdRequest = getInteractWithElementRequest('INTERACT_WITH_ELEMENT_CROSSDOMAIN_FRAME', clickSelector, clickSelectorValue, 'click', Number(crossDomainFrameIndex))
                        chrome.runtime.sendMessage(clickElementInFrameByIdRequest, () => checkChromeError());
                    } else if (isElementInFrame && !crossDomainFrameIndex) {
                        AALogger.info('HTMLExecutor', 'performElementClick', 'sending message to click in element in same domain frame');
                        clickSelectorValue = "i" + clickSelectorTargetIdx++;
                        HtmlElement.setAttribute(clickSelector, clickSelectorValue);
                        var clickElementInFrameRequest = getInteractWithElementRequest('INTERACT_WITH_ELEMENT_SAMEDOMAIN_FRAME', clickSelector, clickSelectorValue, 'click', undefined)
                        chrome.runtime.sendMessage(clickElementInFrameRequest, () => checkChromeError());
                    } else {
                        clickSelectorValue = "i" + clickSelectorTargetIdx++;
                        HtmlElement.setAttribute(clickSelector, clickSelectorValue);
                        AALogger.info('HTMLExecutor', 'performElementClick', 'sending message to click element');
                        var clickElementInMainframeRequest = getInteractWithElementRequest('INTERACT_WITH_ELEMENT', clickSelector, clickSelectorValue, 'click', undefined)
                        chrome.runtime.sendMessage(clickElementInMainframeRequest, () => checkChromeError());
                    }
                } else if (HtmlElement.onclick == null && HtmlElement.onmousemove == null && HtmlElement.onmouseover == null &&
                    HtmlElement.onmousedown == null && HtmlElement.onmouseup == null && !PageFramework.ShouldSimulateClicks(HtmlElement, requestObj)) {
                    HtmlElement.click();
                } else {
                    simulateClickEvent(HtmlElement);
                }
            }
        } catch (e) {
            checkOnClickEvent(HtmlElement);
            AALogger.warn('HTMLExecutor', 'performElementClick', e.message);
        }
    }

    function getInteractWithElementRequest(type, targetAttribute, targetValue, elementMethod, frameId) {
        var interactWithElementRequest = {
            type: type,
            targetAttribute: targetAttribute,
            targetValue: targetValue,
            elementMethod: elementMethod,
            frameId: frameId,
        };
        return interactWithElementRequest;
    }

    function actionClick(HtmlElement, isElementInFrame, frameIndex) {
        var result = new HTMLResult();
        performElementClick(HtmlElement, isElementInFrame, frameIndex);
        result.SetStatus(true);
        return result;
    }

    function actionSetText(HtmlElement, Value1, IsSecureVal) {
        var result = new HTMLResult();
        try {
            if (!IsSecureElement(IsSecureVal, HtmlElement)) {
                result.SetErrorCode(HTMLErrorCode.NotAllowedSecureValue);
                result.SetStatus(false);
                return result;
            }

            performElementClick(HtmlElement);
            HtmlElement.value = '';
            setTextValue(HtmlElement, Value1);
        } catch (e) {
            AALogger.error('HTMLExecutor', 'setText', e.message);
        }
        result.SetStatus(true);
        return result;
    }

    function IsSecureElement(IsSecureVal, HtmlElement) {
        if (IsSecureVal == undefined|| IsSecureVal==null)
            return true;

        if ("true" == IsSecureVal.toLowerCase()) {
            if (HtmlElement.type.toLowerCase() != "password") {
                return false;
            }
        }
        return true;
    }

    var _HTMLDoc = null;

    function setTextValue(el, val) {
        if (val == null) return;
        setValue(el, val, false);
    }

    function createSelection(el, start, end) {
        if (el.createTextRange) {
            var selRange = el.createTextRange();
            selRange.collapse(true);
            selRange.moveStart('character', start);
            selRange.moveEnd('character', end);
            selRange.select();
            el.focus();
        } else if (el.setSelectionRange) {
            el.focus();
            el.setSelectionRange(start, end);
        } else if (typeof el.selectionStart != 'undefined') {
            el.selectionStart = start;
            el.selectionEnd = end;
            el.focus();
        }
    }

    function setValue(el, val, appendText) {
        if (_isIE()) simulateEvent(el, "focusin");

        simulateEvent(el, "focus");

        if (appendText)
            createSelection(el, el.value.length, el.value.length);

        val = "" + val;

        var ua = this.navigator.userAgent.toLowerCase();

        if (ua.indexOf("windows") != -1) {
            val = val.replace(/\r/g, '');
            if (!this._isFF() || this._getFFVersion() >= 12) val = val.replace(/\n/g, '\r\n');
        }
        var prevVal = el.value;

        if (this._isFF4Plus()) this._focus(el); // test with textarea.sah

        if (el.type && (el.type == "hidden")) {
            el.value = val;
            return;
        } else if (el.type && (el.type == "range" || el.type == "date")) {
            el.value = val;
        } else if (el.type && el.type.indexOf("select") != -1) {
        } else {
            var append = (el && el.type && (this.findInArray(this.textboxTypes, el.type) != -1) && this.shouldAppend(el));
            if (appendText == false)
                el.value = "";
            if (typeof val == "string") {
                var len = val.length;
                if (el.maxLength && el.maxLength >= 0 && val.length > el.maxLength)
                    len = el.maxLength;
                for (var i = 0; i < len; i++) {
                    var c = val.charAt(i);
                    this.simulateKeyPressEvents(el, c, null, append);
                }
            }
        }
        var triggerOnchange = prevVal != val;
        this.setLastBlurFn(function () {
            try {
                // on IE9, sequence is change, focusout, blur
                if (triggerOnchange) {
                    if (!_isFF3())
                        simulateEvent(el, "change");
                }
                if (_isIE()) simulateEvent(el, "focusout");
                simulateEvent(el, "blur");
            } catch (e) {
            }
        });
    }

    _focus = function (el) {
        try {
            el.focus();
        } catch (e) {
        }
        simulateEvent(el, "focus");
    };

    wrap = function (fn) {
        if (fn == undefined)
            return null;
        var el = this;
        if (this.wrapped[fn] == null) {
            this.wrapped[fn] = function () {
                return fn.apply(el, arguments);
            };
        }
        return this.wrapped[fn];
    };

    setLastBlurFn = function (fn) {
        if (this.lastBlurTimeout) window.clearTimeout(this.lastBlurTimeout);
        this.lastBlurFn = fn;
        var lastBlur = this.wrap(this.invokeLastBlur);
        if (lastBlur != null && lastBlur != undefined)
            this.lastBlurTimeout = window.setTimeout(lastBlur, BLUR_TIMEOUT);
    }

    function simulateEvent(target, evType) {
        var useCreateEvent = !this._isIE() || this._isIE9PlusStrictMode();
        var useCreateEventObject = this._isIE();
        if (useCreateEvent) {
            var evt = new Object();
            evt.type = evType;
            evt.button = 0;
            evt.bubbles = true;
            evt.cancelable = true;
            if (!target) return;
            var event = target.ownerDocument.createEvent("HTMLEvents");
            event.initEvent(evt.type, evt.bubbles, evt.cancelable);
            target.dispatchEvent(event);
        }
        if (useCreateEventObject) {
            var evt = target.ownerDocument.createEventObject();
            evt.type = evType;
            evt.bubbles = true;
            evt.cancelable = true;
            evt.cancelBubble = true;
            try {
                target.fireEvent(this.getEventTypeName(evType), evt);
            } catch (e) {
                target.fireEvent("on" + this.getEventTypeName(evType), evt);
            }
        }
    }

    getKeyCode = function (charCode) {
        return (charCode >= 97 && charCode <= 122) ? charCode - 32 : charCode;
    }

    _getFFVersion = function () {
        var m = navigator.userAgent.match(/(Firefox|Iceweasel|Shiretoko)[/]([0-9]+)/);
        return (m && m.length == 3) ? parseInt(m[2]) : -1;
    }

    simulateKeyPressEvents = function (el, val, combo, append) {
        var origVal = el.value;
        var keyCode = 0;
        var charCode = 0;
        var c = null;
        if (typeof val == "number") {
            charCode = val;
            keyCode = this.getKeyCode(charCode);
            c = String.fromCharCode(charCode);
        } else if (typeof val == "object") {
            keyCode = val[0];
            charCode = val[1];
            c = String.fromCharCode(charCode);
        } else if (typeof val == "string") {
            charCode = val.charCodeAt(0);
            keyCode = this.getKeyCode(charCode);
            c = val;
        }
        var isShift = (charCode >= 65 && charCode <= 90);
        if (isShift) combo = "" + combo + "|SHIFT|";
        this.simulateKeyEvent([(isShift ? 16 : keyCode), 0], el, "keydown", combo);
        if (this.isSafariLike()) {
            this.simulateKeyEvent([keyCode, charCode], el, "keypress", combo);
        } else {
            this.simulateKeyEvent([0, charCode], el, "keypress", combo);
        }
        if (append && charCode != 10 && origVal == el.value) {
            if (!this._isFF4Plus() || (this._isFF4Plus() && !(combo == "CTRL" || combo == "ALT")))
                el.value += c;
        }
        this.simulateKeyEvent([keyCode, 0], el, "keyup", combo);
    };

    simulateKeyEvent = function (codes, target, evType, combo) {
        var keyCode = codes[0];
        var charCode = codes[1];
        if (!combo) combo = "";
        var isShift = combo.indexOf("SHIFT") != -1;
        var isCtrl = combo.indexOf("CTRL") != -1;
        var isAlt = combo.indexOf("ALT") != -1;
        var isMeta = combo.indexOf("META") != -1;

        if (!this._isIE() || this._isIE9PlusStrictMode()) { // FF chrome safari opera
            if (this.isSafariLike() || window.opera || this._isIE9PlusStrictMode()) {
                if (target.ownerDocument.createEvent) {
                    var event = target.ownerDocument.createEvent('HTMLEvents');

                    var bubbles = true;
                    var cancelable = true;
                    var evt = event;
                    if (!window.opera) {
                        // this may not have any effect.
                        evt.bubbles = bubbles;
                        evt.cancelable = cancelable;
                    }
                    evt.ctrlKey = isCtrl;
                    evt.altKey = isAlt;
                    evt.metaKey = isMeta;
                    evt.charCode = charCode;
                    evt.keyCode = (evType == "keypress") ? charCode : keyCode;
                    evt.shiftKey = isShift;
                    evt.which = evt.keyCode;
                    evt.initEvent(evType, bubbles, cancelable); // don't use evt.bubbles etc. because it may be readonly and never be set to true. Chrome enter on extjs.
                    target.dispatchEvent(evt);
                }
            } else { //FF
                var evt = new Object();
                evt.type = evType;
                evt.bubbles = true;
                evt.cancelable = true;
                evt.ctrlKey = isCtrl;
                evt.altKey = isAlt;
                evt.metaKey = isMeta;
                evt.keyCode = keyCode;
                evt.charCode = charCode;
                evt.shiftKey = isShift;

                if (!target) return;
                var event = null;
                try {
                    event = target.ownerDocument.createEvent("KeyEvents");
                    event.initKeyEvent(evt.type, evt.bubbles, evt.cancelable, target.ownerDocument.defaultView,
                        evt.ctrlKey, evt.altKey, evt.shiftKey, evt.metaKey, evt.keyCode, evt.charCode);
                } catch (e) {
                    event = target.ownerDocument.createEvent("Events");
                    event.initEvent(evt.type, true, true);
                    event.view = window;
                    event.altKey = isAlt;
                    event.ctrlKey = isCtrl;
                    event.shiftKey = isShift;
                    event.metaKey = isMeta;
                    event.keyCode = keyCode;
                    event.charCode = charCode;
                }

                target.dispatchEvent(event);
            }
        }
        if (this._isIE()) { // IE
            var evt = target.ownerDocument.createEventObject();
            evt.type = evType;
            evt.bubbles = true;
            evt.cancelable = true;
            //var xy = this.findClientPos(target);
            //evt.clientX = xy[0];
            //evt.clientY = xy[1];
            evt.ctrlKey = isCtrl;
            evt.altKey = isAlt;
            evt.metaKey = isMeta;
            evt.keyCode = (this._isIE() && evType == "keypress") ? charCode : keyCode;
            evt.shiftKey = isShift; //c.toUpperCase().charCodeAt(0) == evt.charCode;
            evt.shiftLeft = isShift;
            evt.cancelBubble = true;
            evt.target = target;
            try {
                target.fireEvent(this.getEventTypeName(evType), evt);
            } catch (e) {
                target.fireEvent("on" + this.getEventTypeName(evType), evt);
            }
        }
    };

    shouldAppend = function (el) {
        return !((this._isFF() && !this._isFF4Plus() && !this._isHTMLUnit()) || el.readOnly || el.disabled);
    };

    getEventTypeName = function (type) {
        return ((typeof MooTools) == "object") ? type : ("on" + type);
    };

    findInArray = function (ar, el) {
        var len = ar.length;
        for (var i = 0; i < len; i++) {
            if (ar[i] == el) return i;
        }
        return -1;
    };

    _isIE9PlusStrictMode = function () {
        return this._isIE() && document.documentMode >= 9;
    };

    _isFF2 = function () {
        return /Firefox\/2[.]|Iceweasel\/2[.]|Shiretoko\/2[.]/.test(this.navigator.userAgent);
    };
    _isFF3 = function () {
        return /Firefox\/3[.]|Iceweasel\/3[.]|Shiretoko\/3[.]/.test(this.navigator.userAgent);
    };
    _isFF4 = function () {
        return /Firefox\/4[.]|Iceweasel\/4[.]|Shiretoko\/4[.]/.test(this.navigator.userAgent);
    };
    _isFF5 = function () {
        return /Firefox\/5[.]|Iceweasel\/5[.]|Shiretoko\/5[.]/.test(this.navigator.userAgent);
    };
    _isFF4Plus = function () {
        return (this._isFF() && !this._isFF2() && !this._isFF3());
    };
    _isFF = function () {
        return /Firefox|Iceweasel|Shiretoko/.test(this.navigator.userAgent);
    };
    _isChrome = function () {
        return /Chrome/.test(this.navigator.userAgent);
    };

    _isSafari = function () {
        return /Safari/.test(this.navigator.userAgent) && !(/Chrome/.test(this.navigator.userAgent));
    };
    _isOpera = function () {
        return /Opera/.test(this.navigator.userAgent);
    };

    isSafariLike = function () {
        return /Konqueror|Safari|KHTML/.test(this.navigator.userAgent);
    };

    function invokeLastBlur() {
        if (this.lastBlurFn) {
            window.clearTimeout(this.lastBlurTimeout);
            this.doNotRecord = true;
            this.lastBlurFn();
            this.doNotRecord = false;
            this.lastBlurFn = null;
        }
    }

    function actionAppendText(HtmlElement, Value1, IsSecureVal) {
        var result = new HTMLResult();
        try {
            if (!IsSecureElement(IsSecureVal, HtmlElement)) {
                result.SetErrorCode(HTMLErrorCode.NotAllowedSecureValue);
                result.SetStatus(false);
                return result;
            }
            setValue(HtmlElement, Value1, true);
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'appendText', e.message);
        }
        result.SetStatus(true);
        return result;
    }

    function actionGetName(HtmlElement) {
        var result = new HTMLResult();
        var htmlCommon = new HTMLCommon(HtmlElement);
        var nameString = htmlCommon.GetHTMLName();
        result.SetStatus(true);
        result.AddValue(nameString);
        return result;
    }

    function actionGetValue(HtmlElement) {
        var result = new HTMLResult();
        var htmlCommon = new HTMLCommon(HtmlElement);
        var valStr = htmlCommon.GetHTMLValue();
        result.AddValue(htmlCommon.GetHTMLValue());
        result.SetStatus(true);
        return result;
    }

    function actionSelect(HtmlElement) {
        var result = new HTMLResult();
        try {
            if (HtmlElement.checked == false) {
                performElementClick(HtmlElement);
            }

            if (HtmlElement.checked == false) {
                checkOnSelectEvent(HtmlElement);
                HtmlElement.checked = true;
            }
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'actionSelect', e.message);
        }

        result.SetStatus(true);
        return result;
    }

    function actionCheck(HtmlElement) {
        var result = new HTMLResult();

        try {
            if (HtmlElement.checked == false) {
                performElementClick(HtmlElement);
            }

            if (HtmlElement.checked == false) {
                checkOnSelectEvent(HtmlElement);
                HtmlElement.checked = true;
            }
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'actionCheck', e.message);
        }
        result.SetStatus(true);
        return result;

    }

    function actionUnCheck(HtmlElement) {
        var result = new HTMLResult();
        try {
            if (HtmlElement.checked == true) {
                performElementClick(HtmlElement);
            }

            if (HtmlElement.checked == true) {
                checkOnClickEvent(HtmlElement);
                HtmlElement.checked = false;
            }
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'actionUnCheck', e.message);
        }

        result.SetStatus(true);
        return result;
    }

    function actionToggle(HtmlElement) {
        var result = new HTMLResult();
        try {
            var checkedStat = HtmlElement.checked;
            performElementClick(HtmlElement);

            if (HtmlElement.checked == checkedStat) {
                checkOnClickEvent(HtmlElement);
                if (checkedStat == true)
                    HtmlElement.checked = false;
                else
                    HtmlElement.checked = true;
            }
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'actionToggle', e.message);
        }

        result.SetStatus(true);
        return result;
    }

    function actionGetStatus(HtmlElement) {
        var result = new HTMLResult();
        var statusString = false;
        try {
            if (HtmlElement.type == CONTROLTYPE_RADIO) {
                if (HtmlElement.checked)
                    statusString = STATUS_SELECTED;
                else if (!HtmlElement.checked)
                    statusString = STATUS_DESELECTED;
            }
            else if (HtmlElement.type == CONTROLTYPE_CHECKBOX) {
                if (HtmlElement.indeterminate != undefined && HtmlElement.indeterminate && HtmlElement.checked)
                    statusString = STATUS_INTERMEDIATE;
                else if (HtmlElement.checked)
                    statusString = STATUS_CHECKED;
                else if (HtmlElement.checked == false)
                    statusString = STATUS_UNCHECKED;
            }
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'actionGetStatus', e.message);
        }

        result.AddValue(statusString);
        result.IsSuccess = true;
        return result;
    }

    function listviewTotalItems(HtmlElement) {
        var result = new HTMLResult();
        if (HtmlElement.tagName.toLowerCase() == "li") {
            HtmlElement = HtmlElement.parentNode;
        }
        var items = HtmlElement.getElementsByTagName("li");
        result.SetStatus(true);
        result.AddValue(items.length);
        return result;
    }

    function getElementByTag(htmlElement) {
        var result = new HTMLResult();
        if (htmlElement.tagName.toLowerCase() == "li")
            htmlElement = htmlElement.parentNode;

        return htmlElement.getElementsByTagName("li");
    }

    function listviewSelectByText(HtmlElement, Value1) {
        try {
            var items = getElementByTag(HtmlElement);
            for (var i = 0; i < items.length; i++) {
                if (items[i].innerText == Value1.toString())
                    return click(items[i]);

            }
            return false;
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'listviewSelectByText', e.message);
            return false;
        }
    }

    function totalItems(HtmlElement) {
        var result = new HTMLResult();
        if (HtmlElement.options != undefined) {
            var length = HtmlElement.options.length;
            result.AddValue(length);
            result.SetStatus(true);
        }
        return result;
    }

    function actionGetTotalItems(HtmlElement) {
        var result = new HTMLResult();
        try {
            result = totalItems(HtmlElement);

            if (!result.IsSuccess)
                result = listviewTotalItems(HtmlElement);
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'actionGetTotalItems', e.message);
        }
        return result;
    }

    function actionGetSelected(HtmlElement, ActionToExecute) {
        var result = new HTMLResult();
        result.Values = getSelectedIndexText(HtmlElement, ActionToExecute);
        result.SetStatus(result.Values != null);
        return result;
    }


    function actionSelectItem(HtmlElement, Value1, ActionToExecute) {
        var result = new HTMLResult();
        var isSuccess = false;
        try {
            var hookResult = PageFramework.ExecuteActionSelectItem(HtmlElement, Value1, ActionToExecute, this, requestObj);
            if(hookResult) {
                return hookResult;
            }
            else if (ActionToExecute == HTMLControlAction.SelectItemByText) {
                isSuccess = performSelectItemByText(HtmlElement, Value1);
                if (!isSuccess) {
                    isSuccess = listviewSelectByText(HtmlElement, Value1)
                }
                result.SetStatus(isSuccess);
            }
            else {
                var index = parseInt(Value1) - 1;
                if (HtmlElement.selectedIndex != undefined) {
                    if (HtmlElement.options != undefined && (index < HtmlElement.options.length && index >= 0)) {
                        if (requestObj.IsMultiSelectionKeyDown == true) {
                            HtmlElement.options[index].selected = true;
                            isSuccess = true;
                        } else {
                            HtmlElement.selectedIndex = index;
                            isSuccess = HtmlElement.selectedIndex == index;
                        }

                        fireEvent(HtmlElement, "click");
                        checkOnChangeEvent(HtmlElement);
                    }
                }
                if (!isSuccess) {
                    var items = getElementByTag(HtmlElement);
                    if (index < items.length)
                        isSuccess = click(items[index]);
                }
                result.SetStatus(isSuccess);
            }
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'actionSelectItem', e.message);
            result.SetStatus(isSuccess);
        }
        return result;
    }

    function actionExpand(HtmlElement) {
        var result = new HTMLResult();
        result.SetStatus(mouseDown(HtmlElement));
        return result;
    }

    function actionGetChildren(HtmlElement, ActionToExecute) {
        var result = new HTMLResult();
        try {
            if (ActionToExecute == HTMLControlAction.GetChildrenName)
                _childrenName.push(new HTMLCommon(HtmlElement).GetHTMLName());
            else
                _childrenName.push(new HTMLCommon(HtmlElement).GetHTMLValue());
            getNameOfAllChildren(HtmlElement, ActionToExecute);
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'actionGetChildren', e.message);
        }
        result.SetStatus(true);
        result.Values = _childrenName;
        return result;
    }

    function actionGetTableOuterHTML(HtmlElement) {
        var result = new HTMLResult();
        if (HtmlElement.outerHTML != undefined) {

            result.SetStatus(true);
            result.AddValue(HtmlElement.outerHTML);
        }
        return result;
    }

    function actionSetCellByIndex(HtmlElement, Value1, Value2) {

        var result = new HTMLResult();
        try {
            var row = parseInt(Value2.split(',')[0]);
            var col = parseInt(Value2.split(',')[1]);

            var cells = HtmlElement.rows[row - 1].cells[col - 1].childNodes;

            for (var i = 0; i < cells.length; i++) {
                if (cells[i].nodeName.toLowerCase() == "input") {
                    switch (cells[i].type.toLowerCase()) {
                        case "text": {
                            return actionSetText(cells[i], Value1);
                        }
                        case "checkbox": {
                            switch (Value1.toLowerCase()) {
                                case "check": {
                                    return actionCheck(cells[i]);
                                }
                                case "uncheck": {
                                    return actionUnCheck(cells[i]);
                                }
                                case "toggle": {
                                    return actionToggle(cells[i]);
                                }
                            }
                        }
                        case "radio": {
                            if (Value1.toLowerCase() == "select") {
                                return actionSelect(cells[i]);
                            }
                        }

                    }
                }
                else if (cells[i].nodeName.toLowerCase() == "select") {
                    return actionSelectItem(cells[i], Value1, HTMLControlAction.SelectItemByText);
                }
            }
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'actionSetCellByIndex', e.message);
        }
        result.SetStatus(false);
        return result;
    }

    function actionSetCellByText(HtmlElement, Value1, Value2) {
        var result = new HTMLResult();
        try {
            for (var row = 0; row < HtmlElement.rows.length; row++) {
                for (var col = 0; col < HtmlElement.rows[row].cells.length; col++) {

                    var cells = HtmlElement.rows[row].cells[col].childNodes;

                    for (var i = 0; i < cells.length; i++) {
                        if (cells[i].nodeName.toLowerCase() == "input") {
                            switch (cells[i].type.toLowerCase()) {
                                case "text": {
                                    var htmlCommon = new HTMLCommon(cells[i]);
                                    var valStr = htmlCommon.GetHTMLValue();
                                    if (valStr == Value2)
                                        return actionSetText(cells[i], Value1);
                                }
                                    break;
                                case "checkbox": {
                                    switch (Value2.toLowerCase()) {
                                        case "check": {
                                            if (cells[i].checked) {
                                                if (Value1.toLowerCase() == "uncheck") {
                                                    return actionUnCheck(cells[i]);
                                                }
                                            }
                                        }
                                            break;
                                        case "uncheck": {
                                            if (cells[i].checked == false) {
                                                if (Value1.toLowerCase() == "check") {
                                                    return actionCheck(cells[i]);
                                                }
                                            }
                                        }
                                            break;
                                    }
                                }
                                    break;
                            }
                        } else if (cells[i].nodeName.toLowerCase() == "select") {
                            var valStr = getSelectedIndexText(cells[i], HTMLControlAction.GetSelectedText);
                            if (valStr == Value2)
                                return actionSelectItem(cells[i], Value1, HTMLControlAction.SelectItemByText);
                        }
                    }

                }
            }
        } catch (e) {
            AALogger('HTMLExecutor', 'actionSetCellByText', e.message);
        }
        result.SetStatus(false);
        return result;
    }

    function actionGetProperty(HtmlElement, Value1) {
        var result = new HTMLResult();
        var objHTML = new HTMLObject(requestObj.ParentPoint);
        objHTML.ControlElement = HtmlElement;
        objHTML.RequestAction = requestAction;
        var searchCriteria = new Array();
        searchCriteria.push(Value1);
        objHTML.FillPropertiesBasedOnSearchCriteria(null);
        result.SetStatus(true);

        switch (Value1) {
            case HTMLPropertyEnum.IEClass: {
                result.AddValue(objHTML.IEClass);
                break;
            }
            case HTMLPropertyEnum.IEHeight:
            case  "Height": {
                result.AddValue(objHTML.IEHeight);
                break;
            }
            case HTMLPropertyEnum.IEHref: {
                result.AddValue(objHTML.IEHref);
                break;
            }
            case HTMLPropertyEnum.IEFrameSrc: {
                result.AddValue(objHTML.IEFrameSrc);
                break;
            }
            case HTMLPropertyEnum.IEID: {
                result.AddValue(objHTML.IEID);
                break;
            }
            case HTMLPropertyEnum.IEInnerText: {
                result.AddValue(objHTML.IEInnerText);
                break;
            }
            case HTMLPropertyEnum.IEName:
            case HTMLPropertyEnum.Name: {
                result.AddValue(objHTML.IEName);
                break;
            }
            case HTMLPropertyEnum.IELeft: {
                result.AddValue(objHTML.IELeft);
                break;
            }
            case HTMLPropertyEnum.IEParent: {
                result.AddValue(objHTML.IEParent);
                break;
            }
            case HTMLPropertyEnum.IETag: {
                result.AddValue(objHTML.IETag);
                break;
            }
            case HTMLPropertyEnum.IETitle: {
                result.AddValue(objHTML.IETitle);
                break;
            }
            case HTMLPropertyEnum.IETop: {
                result.AddValue(objHTML.IETop);
                break;
            }
            case HTMLPropertyEnum.IEType: {
                result.AddValue(objHTML.IEType);
                break;
            }
            case HTMLPropertyEnum.IEValue: {
                result.AddValue(objHTML.IEValue);
                break;
            }
            case HTMLPropertyEnum.IEWidth:
            case "Width": {
                result.AddValue(objHTML.IEWidth);
                break;
            }
            case HTMLPropertyEnum.IEAlt: {
                result.AddValue(objHTML.IEAlt);
                break;
            }
            case HTMLPropertyEnum.IETagIndex: {
                result.AddValue(objHTML.IETagIndex);
                break;
            }
            case HTMLPropertyEnum.IEClassId: {
                result.AddValue(objHTML.IEClassId);
                break;
            }
            case HTMLPropertyEnum.DOMXPath: {
                result.AddValue(objHTML.DOMXPath);
                break;
            }
            case HTMLPropertyEnum.IsVisible: {
                result.AddValue(getVisibility(HtmlElement));
                break;
            }
            case HTMLPropertyEnum.Path: {
                result.AddValue(objHTML.Path);
                break;
            }
            case "Left": {
                result.AddValue(objHTML.Left);
                break;
            }
            case "Top": {
                result.AddValue(objHTML.Top);
                break;
            }
            default: {
                try {
                    result.AddValue(getPropertyfromNotations(HtmlElement, Value1));
                } catch (e) {
                    return result;
                }
            }
        }
        return result;
    }

    //End Action Functions
    function getVisibility(element) {
        if (!IsElementOnScreen(element) || isHidden(element))
            return false;

        return true;
    }

    function isHidden(element) {
        if (!HTMLCommon.IsVisible(element) || HTMLCommon.IsAriaHidden(element))
            return true;

        return false;
    }

    function getPropertyfromNotations(o, s) {
        try {
            s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
            s = s.replace(/^\./, '');           // strip a leading dot
            var a = s.split('.');
            while (a.length) {
                var n = a.shift();
                if (n in o) {
                    o = o[n];
                } else {
                    return;
                }
            }
            return o;
        } catch (e) {
            return "";
        }
    }

    function ExecuteAction(HtmlElement, ActionToExecute, Value1, Value2, IsSecureVal, isElementInFrame, frameIndex) {
        switch (ActionToExecute) {
            case HTMLControlAction.Click:
                return actionClick(HtmlElement, isElementInFrame, frameIndex);
            case HTMLControlAction.SetText:
                return actionSetText(HtmlElement, Value1, IsSecureVal);
            case HTMLControlAction.AppendText:
                return actionAppendText(HtmlElement, Value1, IsSecureVal);
            case HTMLControlAction.GetName:
                return actionGetName(HtmlElement);
            case HTMLControlAction.GetValue:
                return actionGetValue(HtmlElement);
            case HTMLControlAction.Select:
                return actionSelect(HtmlElement);
            case HTMLControlAction.Check:
                return actionCheck(HtmlElement);
            case HTMLControlAction.UnCheck:
                return actionUnCheck(HtmlElement, Value1);
            case HTMLControlAction.Toggle:
                return actionToggle(HtmlElement);
            case HTMLControlAction.GetStatus:
                return actionGetStatus(HtmlElement);
            case HTMLControlAction.GetTotalItems:
                return actionGetTotalItems(HtmlElement);
            case HTMLControlAction.GetSelectedText:
            case HTMLControlAction.GetSelectedIndex:
                return actionGetSelected(HtmlElement, ActionToExecute);
            case HTMLControlAction.SelectItemByIndex:
            case HTMLControlAction.SelectItemByText:
                return actionSelectItem(HtmlElement, Value1, ActionToExecute);
            case HTMLControlAction.Expand:
                return actionExpand(HtmlElement);
            case HTMLControlAction.GetChildrenName:
            case HTMLControlAction.GetChildrenValue:
                return actionGetChildren(HtmlElement, ActionToExecute);
            case HTMLControlAction.GetTotalColumns:
                return actionGetTotalColumns(HtmlElement);
            case HTMLControlAction.GetTotalRows:
                return actionGetTotalRows(HtmlElement);
            case HTMLControlAction.GetCellByIndex:
                return actionGetCellByIndex(HtmlElement, Value1, Value2);
            case HTMLControlAction.GetCellByText:
                return actionGetCellByText(HtmlElement, Value1);
            case HTMLControlAction.ExtractToCSV:
                return actionExtractToCSV(HtmlElement);
            case HTMLControlAction.SetCellByIndex:
                return actionSetCellByIndex(HtmlElement, Value1, Value2);
            case HTMLControlAction.SetCellByText:
                return actionSetCellByText(HtmlElement, Value1, Value2);
            case HTMLControlAction.GetProperty:
                return actionGetProperty(HtmlElement, Value1);
            case HTMLControlAction.ClickCellByIndex:
                return actionClickCellByIndex(HtmlElement, Value1, Value2);
            case HTMLControlAction.ClickCellByText:
                return actionClickCellByText(HtmlElement, Value1);
        }
    }

    function performSelectItemByText(HtmlElement, Value1) {
        if (HtmlElement.options != undefined) {
            for (i = 0; i < HtmlElement.options.length; i++) {
                if (HtmlElement.options[i].text.toString().replace(/^\s+|\s+$/g, '') == Value1.toString().replace(/^\s+|\s+$/g, '')) {
                    try {
                        if (requestObj.IsMultiSelectionKeyDown == true) {
                            HtmlElement.options[i].selected = true;
                        }
                        else {
                            HtmlElement.selectedIndex = i;
                        }

                        fireEvent(HtmlElement, "click");
                        checkOnChangeEvent(HtmlElement);
                    }
                    catch (e) {
                        AALogger.warn('HTMLExecutor', 'performSelectItemByText', e.message);
                    }
                    return true;
                }
            }
            return false;
        }
        return false;
    }

    function checkOnChangeEvent(HtmlElement) {
        var result = new HTMLResult();
        try {
            fireEvent(HtmlElement, "change");
            if (HtmlElement.click && this._isFF()) {
                simulateEvent(HtmlElement, "change");
                fireEvent(HtmlElement, "select");
                fireEvent(HtmlElement, "click");
            }
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'changeOnChangeEvent', e.message);
        }
        result.SetStatus(true);
    }

    function checkOnClickEvent(HtmlElement) {
        try {
            fireEvent(HtmlElement, "click");
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'checkOnClickEvent', e.message);
        }
    }

    function checkOnSelectEvent(HtmlElement) {
        var result = new HTMLResult();
        try {
            fireEvent(HtmlElement, "select");
            fireEvent(HtmlElement, "click");
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'checkOnSelectEvent', e.message);
        }

        result.SetStatus(true);
    }

    function fireEvent(element, event) {
        try {
            if (document.createEvent) {
                var evt = document.createEvent("HTMLEvents");
                evt.initEvent(event, true, true);
                return !element.dispatchEvent(evt);
            }
            else if (document.createEventObject) {
                var evt = document.createEventObject();
                return element.fireEvent('on' + event, evt)
            }
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'fireEvent', e.message);
        }
    }

    function getNameOfAllChildren(Element, Action) {
        var nodeChildren = Element.children;
        for (var i = 0; i < nodeChildren.length; i++) {
            var htmCommon = new HTMLCommon(nodeChildren[i]);

            var elementName = "";
            if (Action == HTMLControlAction.GetChildrenName)
                elementName = htmCommon.GetHTMLName();
            else
                elementName = htmCommon.GetHTMLValue();

            if (!(elementName == null || elementName == ""))
                _childrenName.push(elementName);

            getNameOfAllChildren(nodeChildren[i], Action);
        }
    }

    function mouseDown(element) {
        try {
            var eventMouseDown = document.createEvent("MouseEvents");
            eventMouseDown.initEvent("mousedown", true, true);
            eventMouseDown.initMouseEvent("mousedown", true, false, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
            return element.dispatchEvent(eventMouseDown);
        } catch (e) {
            AALogger.info('HTMLExecutor', 'mouseDown', e.message);
            return true;
        }
    }

    function click(element) {
        var eventMouseDown = document.createEvent("MouseEvents");
        eventMouseDown.initEvent("click", true, true);
        eventMouseDown.initMouseEvent("click", true, false, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
        return element.dispatchEvent(eventMouseDown);
    }

    function getCellByIndex(rows, rowIndex, columnIndex) {
        rowIndex = rowIndex - 1;
        columnIndex = columnIndex - 1;
        var htmlCellNodes = rows[rowIndex].cells[columnIndex].childNodes;

        var isFound = false;
        var tableContents = "";
        try {
            for (var i = 0; i < htmlCellNodes.length; i++) {

                if (htmlCellNodes[i].nodeName.toLowerCase() != "#text") {
                    if (htmlCellNodes[i].nodeName.toLowerCase() == "input") {
                        switch (htmlCellNodes[i].type.toLowerCase()) {
                            case "text": {
                                var htmlCommon = new HTMLCommon(htmlCellNodes[i]);
                                tableContents += htmlCommon.GetHTMLValue();
                                isFound = true;
                            }
                                break;
                        }
                    } else if (htmlCellNodes[i].nodeName.toLowerCase() == "select") {
                        tableContents += getSelectedIndexText(htmlCellNodes[i], HTMLControlAction.GetSelectedText);
                        isFound = true;
                    } else {
                        if (isUndefinedOrNullOrEmpty(htmlCellNodes[i].innerText)) {
                            tableContents += htmlCellNodes[i].textContent;
                        } else
                            tableContents += htmlCellNodes[i].innerText;
                    }
                }
            }

            if (isFound == false) {
                tableContents = rows[rowIndex].cells[columnIndex].innerText;
                if (isUndefinedOrNullOrEmpty(tableContents)) {
                    tableContents = rows[rowIndex].cells[columnIndex].textContent;
                }
            }
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'getCellByIndex', e.message);
        }
        if (!isUndefinedOrNullOrEmpty(tableContents))
            tableContents = tableContents.replace(/^\s+|\s+$/g, '');
        return tableContents;
    }

    function isUndefinedOrNullOrEmpty(valueToCheck) {
        return (valueToCheck == undefined || valueToCheck == null || valueToCheck == "");
    }

    function actionExtractToCSV(HtmlElement) {
        var result = new HTMLResult();

        var tableResult = "";
        try {
            var rows = getTableRows(HtmlElement);
            for (var row = 0; row < rows.length; row++) {

                tableResult += "<Row>";
                for (var col = 0; col < rows[row].cells.length; col++) {
                    var valStr = getCellByIndex(rows, row + 1, col + 1);
                    if (valStr != undefined)
                        tableResult += "<Col" + col + ">" + new HTMLCommon(null).ReplaceSpacialCharacter(valStr.toString()) + "</Col" + col + ">"
                }

                tableResult += "</Row>";
            }
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'actionExtractToCSV', e.message);
        }

        result.SetTableValue(tableResult);
        result.SetStatus(true);
        return result;
    }

    function actionGetTotalRows(HtmlElement) {
        var result = new HTMLResult();
        try {
            var rowsCount = getTableRowCount(HtmlElement);
            result.AddValue(rowsCount);
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'actionGetTotalRows', e.message);
        }
        result.SetStatus(true);
        return result;
    }

    function getTableRowCount(htmlElement) {
        var rowCount = htmlElement.rows.length;;
        if (rowCount > 0) {
            return rowCount;
        }
        return getTableRowCountByTagName(htmlElement);
    }

    function getTableRowCountByTagName(htmlElement) {
        try {
            return htmlElement.getElementsByTagName(TAG_ROW).length;
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'getTableRowsCountByTagName', e.message);
            return 0;
        }
    }

    function getTableRows(htmlElement) {
        var rows = getTableRowsWithoutChildIteration(htmlElement);
        if (rows != undefined && rows.length > 0) {
            return rows;
        }

        return getTableRowsByChildIteration(htmlElement);
    }

    function getTableRowsWithoutChildIteration(htmlElement) {
        return htmlElement.rows;
    }

    function getTableRowsByChildIteration(tableElement) {
        try {
            var headerRows = [];
            var bodyRows = [];
            var footerRows = [];

            for (var i = 0; i < tableElement.children.length; i++) {
                var tempRows = tableElement.children[i].getElementsByTagName(TAG_ROW);

                switch (tableElement.children[i].tagName.toLowerCase()) {
                    case TAG_THEAD:
                        headerRows.push.apply(headerRows, tempRows);
                        break;
                    case TAG_TFOOT:
                        footerRows.push.apply(footerRows, tempRows);
                        break;
                    case TAG_TBODY:
                        bodyRows.push.apply(bodyRows, tempRows);
                        break;
                }
            }
            return getMergedRows(headerRows, bodyRows, footerRows);
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'getTableRowsByChildIteration', e.message);
            return null;
        }
    }

    function getMergedRows(headerRows, tableBodyRows, footerRows) {
        var rows = headerRows;
        rows.push.apply(rows, tableBodyRows);
        rows.push.apply(rows, footerRows);

        return rows;
    }

    function actionGetTotalColumns(HtmlElement) {
        var result = new HTMLResult();
        result.AddValue(getTableColumnCount(HtmlElement));
        result.SetStatus(true);
        return result;
    }

    function getTableColumnCount(htmlElement) {
        var totCol = 0;
        try {
            var rows = getTableRows(htmlElement);
            for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                totCol = Math.max(totCol, rows[rowIndex].cells.length);
            }
            return totCol;
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'getTableColumnCount', e.message);
            return totCol > 0 ? totCol : 0;
        }
    }

    function actionGetCellByIndex(HtmlElement, Value1, Value2) {
        var result = new HTMLResult();

        try {
            var row = parseInt(Value2.split(',')[0]);
            var col = parseInt(Value2.split(',')[1]);
            var rows = getTableRows(HtmlElement);
            var valStr = getCellByIndex(rows, row, col);

            result.AddValue(valStr);
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'actionGetCellByIndex', e.message);
        }

        result.SetStatus(true);
        return result;
    }


    function actionGetCellByText(HtmlElement, Value1) {
        var result = new HTMLResult();
        var isFound = true;
        var value = "";
        var isValueMatch = false;

        try {
            var rows = getTableRows(HtmlElement);

            for (var row = 0; row < rows.length; row++) {
                for (var col = 0; col < rows[row].cells.length; col++) {
                    var valStr = getCellByIndex(rows, row + 1, col + 1);
                    if (Value1 == valStr) {
                        isFound = true;
                        isValueMatch = true;
                        value = (row + 1).toString() + "," + (col + 1).toString();
                        break;
                    }
                }
                if (isValueMatch)
                    break;
            }
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'actionGetCellByText', e.message);
        }

        result.AddValue(value);
        result.SetStatus(isFound);
        return result;
    }

    function actionClickCellByIndex(HtmlElement, rowNumber, columnNumber) {
        var result = new HTMLResult();
        var isFound = true;
        var value = "";

        var rowIndex = parseInt(rowNumber) - 1;
        var colIndex = parseInt(columnNumber) - 1;
        var rows = getTableRows(HtmlElement);

        if (rowIndex < 0 || rows.length <= rowIndex) {
            AALogger.info('HTMLExecutor', 'actionClickCellByIndex', "Row index out of range");
            result.AddValue(value);
            result.SetStatus(isFound);
            return result;
        }

        if (colIndex < 0 || rows[rowIndex].cells.length <= colIndex) {
            AALogger.info('HTMLExecutor', 'actionClickCellByIndex', "Column index out of range");
            result.AddValue(value);
            result.SetStatus(isFound);
            return result;
        }

        try {
            performElementClick(rows[rowIndex].cells[colIndex]);
            isFound = true;
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'actionClickCellByIndex', e.message);
        }

        result.AddValue(value);
        result.SetStatus(isFound);
        return result;
    }

    function actionClickCellByText(HtmlElement, cellText) {
        var result = new HTMLResult();
        var isFound = true;
        var value = "";
        var isValueMatch = false;

        try {
            var rows = getTableRows(HtmlElement);

            for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                for (var colIndex = 0; colIndex < rows[rowIndex].cells.length; colIndex++) {
                    var valStr = getCellByIndex(rows, rowIndex + 1, colIndex + 1);
                    if (cellText == valStr) {
                        isValueMatch = true;
                        isFound = true;
                        performElementClick(rows[rowIndex].cells[colIndex]);
                        break;
                    }
                }

                if (isValueMatch)
                    break;
            }
        } catch (e) {
            AALogger.warn('HTMLExecutor', 'actionClickCellByIndex', e.message);
        }

        result.AddValue(value);
        result.SetStatus(isFound);
        return result;
    }
}
"";
