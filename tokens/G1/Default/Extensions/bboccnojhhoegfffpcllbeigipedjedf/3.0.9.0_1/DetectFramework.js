function PageFrameworkManager() {
    // the active page-framework, if one is present
    this.activePageFramework = null;
    // a list of all page frameworks that were registered
    this.registeredPageFrameworks = [];
    // the results of the injected page-script to determine framework selection
    this.documentFrameworkInfo = null;

    this.RegisterPageFramework = function(frameworkCls) {
        //Currently, only one page framework is supported at a time. the first active one will be used.
        frameworkCls.prototype = Object.create(HTMLPageFramework.prototype);
        let frameworkObj = new frameworkCls();

        this.registeredPageFrameworks.push(frameworkObj);
        if (this.activePageFramework) {
            return;
        }
        if (this.documentFrameworkInfo && frameworkObj.CheckActive(PageFramework.documentFrameworkInfo)) {
            this.activePageFramework = frameworkObj;
        }
    }

    this.CheckActivePageFramework = function(requestObject) {
        if (PageFramework.activePageFramework) {
            if (PageFramework.activePageFramework.minimumCaptureVersion) {
                let minVersion = PageFramework.activePageFramework.minimumCaptureVersion;
                let requestVersion = null;
                if (requestObject && requestObject.PluginObject && requestObject.PluginObject.CaptureVersion) {
                    requestVersion = requestObject.PluginObject.CaptureVersion;
                }
                else if (requestObject && requestObject.ActionData && requestObject.ActionData.CaptureVersion) {
                    requestVersion = requestObject.ActionData.CaptureVersion;
                }
                if (!requestVersion || requestVersion < minVersion) {
                    return false;
                }
            }
            return true;
        }
    }

    this.AdjustCapturedElement = function(originalElement, requestObject, currentDocument, frameInfo) {
        if (PageFramework.CheckActivePageFramework(requestObject)) {
            var htmlNode = PageFramework.activePageFramework.AdjustCapturedElement(originalElement, requestObject, currentDocument, frameInfo);
            if (htmlNode) {
                return htmlNode;
            }
        }
    }

    this.ShouldSimulateClicks = function (htmlElement, requestObject) {
        if (PageFramework.CheckActivePageFramework(requestObject)) {
            return PageFramework.activePageFramework.ShouldSimulateClicks(htmlElement);
        }
        return false;
    }

    this.ExecuteActionSelectItem = function (htmlElement, value, actionToExecute, htmlExecutor, requestObject) {
        if (PageFramework.CheckActivePageFramework(requestObject)) {
            return PageFramework.activePageFramework.ExecuteActionSelectItem(htmlElement, value, actionToExecute, htmlExecutor);
        }
    }

    this.GetElementDOMXPath = function(htmlElement) {
        if (PageFramework.activePageFramework) {
            try {
                return PageFramework.activePageFramework.GetElementDOMXPath(htmlElement);
            }
            catch(e) {
                // an exception from the pageframework still allows us to capture normally instead
                AALogger('PageFramework', 'GetElementDOMXPath', e);
                return;
            }
        }
    }
};

var PageFramework = new PageFrameworkManager();
function pageFrameworkEventListener(e) {
    AALogger.log("script",'pageFrameworkEventListener event received', e.detail);
    PageFramework.documentFrameworkInfo = e.detail.returnValue.detail;

    if (!PageFramework.activePageFramework) {
        for (let registeredFramework of PageFramework.registeredPageFrameworks) {
            if (registeredFramework.CheckActive(PageFramework.documentFrameworkInfo)) {
                PageFramework.activePageFramework = registeredFramework;
                break;
            }
        }
    }
};

/**
 * Interface for page frameworks
 *
 * @interface
 */
function HTMLPageFramework() {
    this.frameworkName = "";

    /**
     * Determine if this page framework adapter should be enabled.
     * Only one page framework can be active at a time.
     */
    this.CheckActive = function(documentFrameworkInfo) {
        return false;
    }
    /**
     * Return a new HTMLObjectNode for this capture request.
     * If this returns undefined, the original element will be used.
     * @param {Element} originalElement the original DOM element under the mouse cursor
     * @param {Object} requestObject the capture request
     * @param {Document} currentDocument the current document (in case the target is a frame)
     * @param {HTMLFrameInfo} frameInfo target frame info
     */
    this.AdjustCapturedElement = function(originalElement, requestObject, currentDocument, frameInfo) {
    }

    /**
     * Return true if clicks need to be simulated for this element during playback.
     * Normally the playback HTMLExecutor clicks using element.click(), but if this is set,
     * it instead simulates a full series of mouse events.
     * @param {Element} htmlElement - the element being clicked on
     */
    this.ShouldSimulateClicks = function(htmlElement) {
       return false;
    }

    /**
     * Create an HTMLObjectNode for the target element.
     * @param {Element} targetElement
     * @param {Object} requestObject
     * @param {HTMLFrameInfo} frameInfo
     * @param {Element} [bboxElement] - if provided, sets the bounding box of the HTMLObjectNode to bboxElement's bounding box, for highlighting display.
     */
    this.GetHTMLObjectNode = function(targetElement, requestObject, frameInfo, bboxElement) {
        var result = new HTMLCommon(targetElement).GetHTMLObjectNode(requestObject.ParentPoint, targetElement, requestObject.RequestAction, frameInfo);
        if (bboxElement) {
            result.objNode.FillDimensionsWithElement(bboxElement);
        }
        return result;
    }

    /**
     * Set an HTMLObjectNode as a CheckBox or Radiobutton and update it's state
     * @param {HTMLObjectNode} htmlObjectNode
     * @param {String} checkType
     * @param {String} checkState
     */
    this.SetHTMLNodeChecked = function(htmlObjectNode, checkType, checkState) {
        if (checkType == "checkbox") {
            htmlObjectNode.objNode.Role = "CheckBox";
            if (checkState.toLowerCase() == "false") {
                htmlObjectNode.objNode.States = STATUS_UNCHECKED;
            }
            else if (checkState.toLowerCase() == "true") {
                htmlObjectNode.objNode.States = STATUS_CHECKED;
            }
            else if (checkState.toLowerCase() == "mixed") {
                htmlObjectNode.objNode.States = STATUS_INDETERMINATE;
            }
        }
        if (checkType == "radio") {
            htmlObjectNode.objNode.Role = "RadioButton";
            if (checkState.toLowerCase() == "false") {
                htmlObjectNode.objNode.States = STATUS_DESELECTED;
            }
            else if (checkState.toLowerCase() == "true") {
                htmlObjectNode.objNode.States = STATUS_SELECTED;
            }
        }
    }

    /**
     * Override the playback of a SelectItemByText/SelectItemByIndex action on an element.
     * Returns an HTMLResult if the hook processed the action, otherwise it falls through to normal execution
     * @param {Element} htmlElement
     * @param {Object} value
     * @param {string} actionToExecute
     * @param {HTMLExecutor} htmlExecutor
     * @returns {HTMLResult}
     */
    this.ExecuteActionSelectItem = function (htmlElement, value, actionToExecute, htmlExecutor) {
        return;
    }

    /**
     * Get the portion of an HTMLDOMXPath for this element.
     * Returns a string to be used for this element, otherwise it falls through to normal execution
     * @param {Element} htmlElement
     * @returns {string}
     */
    this.GetElementDOMXPath = function(htmlElement) {
        return;
    }
}

/**
 * Compare an attribute on an element to a target value, ignoring case
 */
function checkElementAttributeValue(element, attrName, attrValue) {
    let elementValue = element.getAttribute(attrName);
    return (elementValue && elementValue.toLowerCase() == attrValue.toLowerCase());
}

/**
 * Search for an element, starting with originalElement and looking at each parentElement, with an attribute matching a value.
 * @param {Element} originalElement
 * @param {string} attrName
 * @param {string} attrValue
 * @param {string} tagName
 * @param {string} hasClass
 * @param {number} [maxDepth] - limit the search depth
 */
function findParentElementWithAttr(originalElement, attrName, attrValue, tagName, hasClass, maxDepth) {
    let depth = 0;
    let currentElement = originalElement;
    while (currentElement && (maxDepth === undefined || depth <= maxDepth)) {
        if (!attrName || checkElementAttributeValue(currentElement, attrName, attrValue)) {
            if (!tagName || (currentElement.tagName.toUpperCase() == tagName)) {
                if (!hasClass || (currentElement.classList && currentElement.classList.contains(hasClass))) {
                    return currentElement;
                }
            }
        }
        depth += 1;
        currentElement = currentElement.parentElement;
    }
}

/**
 * Search for an element, starting with originalElement and looking at each parentElement, containing a child element
 * with an attribute matching a value.
 * @param {Element} originalElement
 * @param {string} childTagName
 * @param {string} childAttrName
 * @param {string} childAttrValue
 * @param {number} [maxDepth] limit the search depth
 * @returns {Array[Element]} [matchingElement, childElement]
 */
function findParentElementWithDirectChild(originalElement, childTagName, childAttrName, childAttrValue, maxDepth) {
    let depth = 0;
    let currentElement = originalElement;
    while (currentElement && (maxDepth === undefined || depth <= maxDepth)) {
        let childElement;
        for (childElement of currentElement.childNodes) {
            if (childTagName && (!childElement.tagName || childElement.tagName.toUpperCase() != childTagName)) {
                continue;
            }
            if (!checkElementAttributeValue(childElement, childAttrName, childAttrValue)) {
                continue;
            }
            return [currentElement, childElement];
        }
        depth += 1;
        currentElement = currentElement.parentElement;
    }
}

/**
 * Attempt a series of searches from a target element to match against a specific markup structure.
 * @param {Element} originalElement
 * @param {Array} relationshipConfigs
 * @param {boolean} [searchOnInputElements] continue searching even if originalElement is an input
 * @returns
 */
function searchForRelatedElements(originalElement, relationshipConfigs, searchOnInputElements) {
    // if we clicked directly on an input, we know it's good
    if (!originalElement || (!searchOnInputElements && originalElement.tagName && originalElement.tagName.toUpperCase() == "INPUT")) {
        return;
    }
    for (let config of relationshipConfigs) {
        let parentElement = originalElement;
        if (config.findParentWithDirectChild) {
            let result = findParentElementWithDirectChild(
                originalElement,
                config.findParentWithDirectChild.childTagName,
                config.findParentWithDirectChild.childAttrName,
                config.findParentWithDirectChild.childAttrValue,
                config.findParentWithDirectChild.maxDepth
            );
            if (result) {
                return [config.tag, result[0], result[1]];
            }
        }
        else if (config.findParent) {
            parentElement = findParentElementWithAttr(
                originalElement,
                config.findParent.attrName,
                config.findParent.attrValue,
                config.findParent.tagName,
                config.findParent.hasClass,
                config.findParent.maxDepth
            );
            if (parentElement) {
                if (config.childQuery) {
                    let targetElement = parentElement.querySelector(config.childQuery);
                    if (targetElement) {
                        return [config.tag, parentElement, targetElement];
                    }
                }
                else {
                    return [config.tag, parentElement, originalElement];
                }
            }
        }
    }
}

/**
 * Search for a matching list item for a SelectItemByText or SelectItemByIndex action
 * @param {Array[Element]} listItemElements
 * @param {string} actionToExecute
 * @param {string} value
 * @returns {Element}
 */
function findListViewItem(listItemElements, actionToExecute, value) {
    if (actionToExecute == HTMLControlAction.SelectItemByText) {
        let strippedValue = value.toString().replace(/^\s+|\s+$/g, '');
        for (let listElement of listItemElements) {
            if (listElement.innerText.toString().replace(/^\s+|\s+$/g, '') == strippedValue) {
                return listElement;
            }
        }
    }
    else {
        let index = parseInt(value) - 1;
        if (index >= 0 && index < listItemElements.length) {
            return listItemElements[index];
        }
    }
}

/**
 * If this element has an attribute in a set of interesting values, and the value is not shared
 * with any other sibling nodes, return that value.
 * @param {Element} htmlElement
 * @param {string} attributeName
 * @param {Array[string]} attributeValues
 * @returns
 */
function checkForUniqueAttributeValue(htmlElement, attributeName, attributeValues) {
    let value = htmlElement.getAttribute(attributeName);
    if (value && attributeValues.indexOf(value.toLowerCase()) >= 0) {
        // only return an automation-id filter if it's unique in this node set
        let parentElement = htmlElement.parentNode;
        if (parentElement) {
            for (let childElement of parentElement.childNodes) {
                if (childElement !== htmlElement && childElement.tagName && childElement.getAttribute("data-automation-id") == value) {
                    return;
                }
            }
        }
        return value;
    }
}

function populateListViewChildren(htmlObject, listItemElements) {
    let htmlCommon = new HTMLCommon(htmlObject.ControlElement);
    let items = [];
    for(let listItem of listItemElements) {
        let itemText = listItem.innerText.toString().replace(/^\s+|\s+$/g, '');
        if(itemText) {
            items.push(itemText);
        }
    }
    htmlObject.ItemCollection = htmlCommon.ReplaceSpacialCharacter(htmlObject.GetStringFromItemCollection(items));
}

/**
 * @class
 * @implements {HTMLPageFramework}
 */
function SAPFioriPageFramework() {
    HTMLPageFramework.call(this);
    this.frameworkName = "sapfiori";

    this.CheckActive = function(documentFrameworkInfo) {
        return documentFrameworkInfo && !!(documentFrameworkInfo.sapfiori);
    }

    this.AdjustCapturedElement = function(originalElement, requestObject, currentDocument, frameInfo) {
        let foundElement = searchForRelatedElements(originalElement, [
            {
                // locate checkbox input by ARIA role
                tag: "checkbox",
                findParent: { attrName: "role", attrValue: "checkbox", maxDepth: 5 },
                childQuery: 'input[type="checkbox"]'
            }, {
                // locate radio input by ARIA role
                // clicking on a radio can be nested deeper, as it's root div -> visual div -> svg -> circle
                tag: "radio",
                findParent: { attrName: "role", attrValue: "radio", maxDepth: 6 },
                childQuery: 'input[type="radio"]'
            }, {
                // locate combobox selection item by ARIA role
                // div [role="dialog"] (linked to input by aria-controls) -> ul[role="listbox"] -> li[role="option"]
                tag: "combobox-item",
                findParent: { attrName: "role", attrValue: "option", tagName: "LI", maxDepth: 5 },
            }, {
                // locate combobox controls (dropdown button) by parent containing input
                tag: "combobox-outer",
                findParentWithDirectChild: { childTagName: "INPUT", childAttrName: "role", childAttrValue: "combobox", maxDepth: 3}
            }, {
                // alternate combobox controls (dropdown button) with the role on the parent
                tag: "combobox-outer-parentrole",
                findParent: { attrName: "role", attrValue: "combobox", tagName: "DIV", maxDepth: 3 },
                childQuery: 'input'
            }, {
                // older SAP: checkbox and radio with no input elements (child img instead)
                tag: "checkbox-noinput",
                findParent: { attrName: "role", attrValue: "checkbox", maxDepth: 3 },
            }, {
                // older SAP: radio div with no input elements
                tag: "radio-noinput",
                findParent: { attrName: "role", attrValue: "radio", maxDepth: 3 },
            }, {
                // older SAP: combobox in the form of a table, parent has role="listbox" (incorrectly)
                tag: "combobox-legacy-outer",
                findParent: { attrName: "role", attrValue: "listbox", maxDepth: 5 },
                childQuery: 'td input'
            }, {
                // older SAP: combobox in the form of a table, no role on parent
                // role="combobox" on input, role="button" on button
                tag: "combobox-legacy-table-outer",
                findParent: { tagName: "TABLE", maxDepth: 6 },
                childQuery: 'input[role="combobox"]'
            }, {
                // legacy combobox selection item (div instead of li)
                // div[role="listbox"] -> div[role="option"]
                tag: "combobox-legacy-item",
                findParent: { attrName: "role", attrValue: "option", tagName: "DIV", maxDepth: 5 },
            }, {
                // older SAP: buttons (including checkbox and radio in tables) with no input elements
                tag: "fallback-button",
                findParent: { attrName: "role", attrValue: "button", maxDepth: 3 },
            }
        ]);

        if (foundElement) {
            let [tag, parentElement, targetElement] = foundElement;
            let htmlNode;
            if (tag == "checkbox" || tag == "radio") {
                // double-check that the IDs seem to match
                // the parent has an ID like "__control1", and sub-elements have IDs like "__control1-RB"
                if (!(targetElement.id.indexOf(parentElement.id) >= 0)) {
                    return;
                }
                htmlNode = this.GetHTMLObjectNode(targetElement, requestObject, frameInfo, parentElement);
            }
            if (tag == "checkbox-noinput" || tag == "radio-noinput") {
                // double-check that the control element has an aria-checked
                let elementChecked = parentElement.getAttribute("aria-checked");
                if (!elementChecked) {
                    return;
                }
                htmlNode = this.GetHTMLObjectNode(parentElement, requestObject, frameInfo);
                if(tag == "checkbox-noinput") {
                    this.SetHTMLNodeChecked(htmlNode, "checkbox", elementChecked);
                }
                if(tag == "radio-noinput") {
                    this.SetHTMLNodeChecked(htmlNode, "radio", elementChecked);
                }
            }
            else if (tag == "combobox-item") {
                // check that everything in our tree is present as expected
                let parentListbox = searchForRelatedElements(parentElement, [{
                    findParent: { attrName: "role", attrValue: "listbox", tagName: "UL", maxDepth: 2 }
                }]);
                if (!parentListbox) {
                    return;
                }
                parentListbox = parentListbox[1];

                let parentDialog = searchForRelatedElements(parentListbox, [{
                    findParent: { attrName: "role", attrValue: "dialog" }
                }]);
                if (!parentDialog) {
                    return;
                }
                parentDialog = parentDialog[1];

                htmlNode = this.GetHTMLObjectNode(parentListbox, requestObject, frameInfo);
                htmlNode.objNode.Role = "ListView";
                populateListViewChildren(htmlNode.objNode, parentListbox.querySelectorAll('li[role="option"]'));
                htmlNode.objItem.ControlElement = parentElement;
                htmlNode.objItem.FillProperty(parentElement);
                htmlNode.objItem.Name = parentElement.innerText;
            }
            else if (tag == "combobox-outer" || tag == "combobox-outer-parentrole") {
                let matched = false;
                // in the SAP 1.90 docs, the combobox button has role=button and an ID relating to the input
                if (checkElementAttributeValue(originalElement, "role", "button")) {
                    let controlId = targetElement.id.replace("-inner", "");
                    if (originalElement.id && originalElement.id.indexOf(controlId) >= 0) {
                        matched = true;
                    }
                }
                // elsewhere on SAP, the markup is different and has no role on the button, but we can match the ID against our parent
                if (parentElement.id && originalElement.id && originalElement.id.indexOf(parentElement.id) >= 0) {
                    matched = true;
                }
                if(!matched) {
                    return;
                }
                htmlNode = this.GetHTMLObjectNode(originalElement, requestObject, frameInfo);
                htmlNode.objNode.Role = "ComboBox";
            }
            else if(tag == "combobox-legacy-outer" || tag == "combobox-legacy-table-outer") {
                let comboInput = parentElement.querySelector('td:first-child input');
                let comboButton = parentElement.querySelector('td:last-child a');
                if(!comboButton) {
                    comboButton = parentElement.querySelector('td:last-child *[role="button"]');
                }
                if(!comboInput || !comboButton) {
                    return;
                }
                if (!(comboButton.id.indexOf(comboInput.id) >= 0)) {
                    return;
                }
                if(!comboButton.parentNode.contains(originalElement)) {
                    return;
                }
                htmlNode = this.GetHTMLObjectNode(comboButton, requestObject, frameInfo);
                htmlNode.objNode.Role = "ComboBox";
            }
            else if (tag == "combobox-legacy-item") {
                // check that everything in our tree is present as expected
                let parentListbox = searchForRelatedElements(parentElement, [{
                    findParent: { attrName: "role", attrValue: "listbox", maxDepth: 4 }
                }]);
                if (!parentListbox) {
                    return;
                }
                parentListbox = parentListbox[1];

                htmlNode = this.GetHTMLObjectNode(parentListbox, requestObject, frameInfo);
                htmlNode.objNode.Role = "ListView";
                populateListViewChildren(htmlNode.objNode, parentListbox.querySelectorAll('div[role="option"]'));
                htmlNode.objItem.ControlElement = parentElement;
                htmlNode.objItem.FillProperty(parentElement);
                htmlNode.objItem.Name = parentElement.innerText;
            }
            else if(tag == "fallback-button") {
                // a fallback button could be a checkbox if it has aria-checked set
                htmlNode = this.GetHTMLObjectNode(parentElement, requestObject, frameInfo);
                let elementChecked = parentElement.getAttribute("aria-checked");
                if (elementChecked) {
                    this.SetHTMLNodeChecked(htmlNode, "checkbox", elementChecked);
                }
                else {
                    htmlNode.objNode.Role = "Button";
                }
            }
            return htmlNode;
        }
    }

    this.ShouldSimulateClicks = function(htmlElement) {
        // the input elements for checkboxes and radios require the simulated click events to toggle properly
        if(htmlElement && htmlElement.tagName && htmlElement.tagName.toUpperCase() == "INPUT") {
            if (htmlElement.type.toLowerCase() == "radio" || htmlElement.type.toLowerCase() == "checkbox") {
                return true;
            }
        }
    }

    this.ExecuteActionSelectItem = function(htmlElement, value, actionToExecute, htmlExecutor) {
        let parentListbox = searchForRelatedElements(htmlElement, [{
            findParent: { attrName: "role", attrValue: "listbox", tagName: "UL", maxDepth: 2 }
        }]);
        let childListElements;
        if (parentListbox) {
            // this action is selecting within an SAP combobox
            parentListbox = parentListbox[1];
            childListElements = parentListbox.querySelectorAll('li[role="option"]');
        }
        else {
            // attempt to find a div-based one instead
            parentListbox = searchForRelatedElements(htmlElement, [{
                findParent: { attrName: "role", attrValue: "listbox", tagName: "DIV", maxDepth: 4 }
            }]);
            if(parentListbox) {
                childListElements = parentListbox.querySelectorAll('div[role="option"]');
            }
        }
        if(parentListbox && childListElements) {
            let found = false;
            let listElement = findListViewItem(childListElements, actionToExecute, value);
            if(listElement) {
                simulateClickEvent(listElement);
                found = true;
            }
            let result = new HTMLResult();
            result.SetStatus(found);
            return result;
        }
    }
}

PageFramework.RegisterPageFramework(SAPFioriPageFramework);


/**
 * @class
 * @implements {HTMLPageFramework}
 */
function WorkdayPageFramework() {
    HTMLPageFramework.call(this);
    this.frameworkName = "workday";
    this.minimumCaptureVersion = 2400;

    this.CheckActive = function (documentFrameworkInfo) {
        return documentFrameworkInfo && !!(documentFrameworkInfo.workday);
    }

    this.AdjustCapturedElement = function (originalElement, requestObject, currentDocument, frameInfo) {
        let foundElement = searchForRelatedElements(originalElement, [
            {
                // locate checkbox by parent containing input
                tag: "checkbox",
                findParentWithDirectChild: { childTagName: "INPUT", childAttrName: "type", childAttrValue: "checkbox", maxDepth: 3 }
            }, {
                // locate checkbox by parent with tag containing input
                tag: "checkbox",
                findParent: { attrName: "data-automation-id", attrValue: "checkbox", maxDepth: 3 },
                childQuery: 'input[type="checkbox"]'
            }, {
                // locate radio by parent containing input
                tag: "radio",
                findParentWithDirectChild: { childTagName: "INPUT", childAttrName: "type", childAttrValue: "radio", maxDepth: 3 }
            }, {
                // locate radio by parent with tag containing input
                tag: "radio",
                findParent: { attrName: "data-automation-id", attrValue: "radio", maxDepth: 3 },
                childQuery: 'input[type="radio"]'
            }, {
                // locate combobox by data-automation-id of selectWidget (no input)
                tag: "select-outer",
                findParent: { attrName: "data-automation-id", attrValue: "selectWidget", maxDepth: 6 }
            }, {
                // locate multiselect combobox by data-automation-id of selectWidget
                tag: "multiselect-outer",
                findParent: { attrName: "data-automation-id", attrValue: "multiselectInputContainer", maxDepth: 6 },
                childQuery: 'input'
            }, {
                // locate combobox selection item by ARIA role
                // div[role="listbox"] -> div[role="option"][data-automation-id="menuItem"]
                tag: "combobox-item",
                findParent: { attrName: "role", attrValue: "option", tagName: "DIV", maxDepth: 5 },
            }
        ], true);

        if (foundElement) {
            let [tag, parentElement, targetElement] = foundElement;
            let htmlNode;
            if (tag == "checkbox" || tag == "radio") {
                htmlNode = this.GetHTMLObjectNode(targetElement, requestObject, frameInfo, parentElement);
                let elementChecked = targetElement.getAttribute("aria-checked");
                if(elementChecked) {
                    // the "value" attribute does not update live, but "aria-checked" does.
                    this.SetHTMLNodeChecked(htmlNode, tag, elementChecked);
                }
            }
            else if (tag == "combobox-item") {
                // multiselect pill options will also match here - return the delete button as a button
                let parentMultiselect = searchForRelatedElements(parentElement, [{
                    findParent: { attrName: "data-automation-id", attrValue: "multiselectInputContainer", maxDepth: 6 }
                }]);
                if(parentMultiselect) {
                    let multiselectItems = searchForRelatedElements(parentElement, [{
                        findParent: { attrName: "data-automation-id", attrValue: "selectedItemList", maxDepth: 4 }
                    }]);
                    if(multiselectItems) {
                        let deleteButton = searchForRelatedElements(originalElement, [{
                            findParent: { attrName: "data-automation-id", attrValue: "DELETE_charm", maxDepth: 4 }
                        }]);
                        if(deleteButton) {
                            deleteButton = deleteButton[1];
                            htmlNode = this.GetHTMLObjectNode(deleteButton, requestObject, frameInfo);
                            htmlNode.objNode.Role = "Button";
                            return htmlNode;
                        }
                    }
                }

                let parentListbox = searchForRelatedElements(parentElement, [{
                    findParent: { attrName: "role", attrValue: "listbox", maxDepth: 4 }
                }]);
                if (!parentListbox) {
                    return;
                }
                parentListbox = parentListbox[1];
                htmlNode = this.GetHTMLObjectNode(parentListbox, requestObject, frameInfo);
                htmlNode.objNode.Role = "ListView";
                populateListViewChildren(htmlNode.objNode, parentListbox.querySelectorAll('*[role="option"]'));
                htmlNode.objItem.ControlElement = parentElement;
                htmlNode.objItem.FillProperty(parentElement);
                htmlNode.objItem.Name = parentElement.innerText;
            }
            else if (tag == "select-outer") {
                // button div has data-automation-id="selectShowAll", value div has data-automation-id="selectSelectedOption"
                htmlNode = this.GetHTMLObjectNode(parentElement, requestObject, frameInfo);
                htmlNode.objNode.Role = "ComboBox";
            }
            else if (tag == "multiselect-outer") {
                // button div has data-automation-id="searchBox", value div has data-automation-id="promptIcon"
                htmlNode = this.GetHTMLObjectNode(parentElement, requestObject, frameInfo);
                htmlNode.objNode.Role = "ComboBox";
            }
            else if (tag == "multiselect-delete-button") {
                // matching here could be improved to somehow identify the element
                htmlNode = this.GetHTMLObjectNode(parentElement, requestObject, frameInfo);
                htmlNode.objNode.Role = "Button";
            }
            return htmlNode;
        }
    }

    this.ShouldSimulateClicks = function (htmlElement) {
        let automationID = htmlElement.getAttribute("data-automation-id");
        if(automationID && ["checkbox", "radio"].indexOf(automationID.toLowerCase()) != -1) {
            return true;
        }
    }


    this.ExecuteActionSelectItem = function (htmlElement, value, actionToExecute, htmlExecutor) {
        let parentListbox = searchForRelatedElements(htmlElement, [{
            findParent: { attrName: "role", attrValue: "listbox", maxDepth: 4 }
        }]);
        let childListElements;
        if (parentListbox) {
            parentListbox = parentListbox[1];
            childListElements = parentListbox.querySelectorAll('*[role="option"]');
        }
        if (parentListbox && childListElements) {
            let found = false;
            let listElement = findListViewItem(childListElements, actionToExecute, value);
            if (listElement) {
                // multiselect comboboxes (with checkbox/radio inside) have a leaf node that needs to get the click event
                let leafElement = listElement.querySelector('*[data-automation-id="promptLeafNode"]');
                if(leafElement) {
                    leafElement.click();
                }
                else {
                    simulateClickEvent(listElement);
                }
                found = true;
            }
            let result = new HTMLResult();
            result.SetStatus(found);
            return result;
        }
    }

    this.GetElementDOMXPath = function(htmlElement) {
        // these automationID values (they're more like classes, not unique IDs) are used to identify elements
        // they will be matched as lowercase
        let interestingAutomationIDs = [
            "checkbox", "radio",
            "selectwidget",
            "multiselectcontainer", // multiselect parent
            "selecteditemlist", //multiselect pills
            "delete_charm", // delete button on multiselect pill
        ];
        let automationID = checkForUniqueAttributeValue(htmlElement, "data-automation-id", interestingAutomationIDs);
        if(automationID) {
            return htmlElement.tagName.toLowerCase() + "[@data-automation-id='" + automationID + "']";
        }
    }
}

PageFramework.RegisterPageFramework(WorkdayPageFramework);


/**
 * @class
 * @implements {HTMLPageFramework}
 */
function SalesforcePageFramework() {
    HTMLPageFramework.call(this);
    this.frameworkName = "lightningsalesforce";
    this.minimumCaptureVersion = 2400;

    this.CheckActive = function (documentFrameworkInfo) {
        // salesforce loads it's scripts fully async, so we fallback to domain checking here
        if (document.URL.indexOf("lightningdesignsystem") >= 0 || document.URL.indexOf(".lightning.force") >= 0) {
            return true;
        }
        return documentFrameworkInfo && !!(documentFrameworkInfo.salesforce);
    }

    this.AdjustCapturedElement = function (originalElement, requestObject, currentDocument, frameInfo) {
        // salesorce lightning uses CSS classes much more than aria attributes, so we're stuck relying on them
        let foundElement = searchForRelatedElements(originalElement, [
            {
                // locate checkbox by parent containing input
                tag: "checkbox",
                findParentWithDirectChild: { childTagName: "INPUT", childAttrName: "type", childAttrValue: "checkbox", maxDepth: 3 }
            }, {
                // locate radio by parent containing input
                tag: "radio",
                findParentWithDirectChild: { childTagName: "INPUT", childAttrName: "type", childAttrValue: "radio", maxDepth: 3 }
            }, {
                // delete button as css class (listed before combobox item to match first)
                tag: "button",
                findParent: { hasClass: "slds-pill__remove", maxDepth: 3 },
                childQuery: 'svg'
            }, {
                // delete etc button (listed before combobox item to match first)
                tag: "button",
                findParent: { tagName: "BUTTON", maxDepth: 3 },
                childQuery: 'svg'
            }, {
                // locate combobox containing textinput
                // div[role="combobox"] -> input
                tag: "combobox-outer",
                findParent: { attrName: "role", attrValue: "combobox", tagName: "DIV", maxDepth: 5 },
                childQuery: 'input'
            }, {
                // locate combobox containing textinput
                // div -> input[role="combobox"]
                tag: "combobox-outer",
                findParentWithDirectChild: { childTagName: "INPUT", childAttrName: "role", childAttrValue: "combobox", maxDepth: 3 }
            }, {
                // locate combobox selection item by ARIA role
                // div[role="listbox"] -> div[role="option"]
                tag: "combobox-item",
                findParent: { attrName: "role", attrValue: "option", maxDepth: 6 },
            }, {
                // locate comboboxy-button selection item by ARIA role
                // div[role="menu"] -> div[role="menuitemradio"]
                tag: "combobox-menuitem",
                findParent: { attrName: "role", attrValue: "menuitem", maxDepth: 6 },
            }, {
                // locate comboboxy-button selection item by ARIA role
                // div[role="menu"] -> div[role="menuitemradio"]
                tag: "combobox-radioitem",
                findParent: { attrName: "role", attrValue: "menuitemradio", maxDepth: 6 },
            }, {
                // datepicker is treated as combobox - has unique "lightning" element tags
                // contains input, but deeply nested
                tag: "datebox-outer",
                findParent: { tagName: "LIGHTNING-DATEPICKER" },
                childQuery: 'input'
            }, {
                // timepicker is treated as combobox - has unique "lightning" element tags
                // contains input, but deeply nested
                tag: "timebox-outer",
                findParent: { tagName: "LIGHTNING-TIMEPICKER" },
                childQuery: 'input'
            }, {
                // combobox with no input
                // div[data-aura-class="uiMenu"] -> a[aria-haspopup="true"]
                tag: "combobox-noinput",
                findParent: { attrName: "data-aura-class", attrValue: "uiMenu" },
                childQuery: '*[aria-haspopup="true"]'
            }, {
                // combobox type-selector is a[role="button"]
                tag: "button",
                findParent: { tagName: "A", attrName: "role", attrValue: "button", maxDepth: 6 },
            }, {
                // save etc button
                tag: "button",
                findParent: { tagName: "BUTTON", maxDepth: 3 }
            }
        ], true);

        if (foundElement) {
            let [tag, parentElement, targetElement] = foundElement;
            let htmlNode;
            if (tag == "checkbox" || tag == "radio") {
                htmlNode = this.GetHTMLObjectNode(targetElement, requestObject, frameInfo, parentElement);
            }
            else if (tag == "combobox-item") {
                let parentListbox = searchForRelatedElements(parentElement, [{
                    findParent: { attrName: "role", attrValue: "listbox", maxDepth: 4 }
                }]);
                if (!parentListbox) {
                    return;
                }
                parentListbox = parentListbox[1];

                // if we clicked on the delete button inside a listitem, return that
                let deleteButton = searchForRelatedElements(originalElement, [{
                    findParent: { hasClass: "deleteAction", maxDepth: 3 }
                }]);
                if (deleteButton) {
                    deleteButton = deleteButton[1];
                    htmlNode = this.GetHTMLObjectNode(deleteButton, requestObject, frameInfo);
                    htmlNode.objNode.Role = "Button";
                    return htmlNode;
                }

                htmlNode = this.GetHTMLObjectNode(parentListbox, requestObject, frameInfo);
                htmlNode.objNode.Role = "ListView";
                populateListViewChildren(htmlNode.objNode, parentListbox.querySelectorAll('*[role="option"]'));
                htmlNode.objItem.ControlElement = parentElement;
                htmlNode.objItem.FillProperty(parentElement);
                htmlNode.objItem.Name = parentElement.innerText;
            }
            else if (tag == "combobox-menuitem" || tag == "combobox-radioitem") {
                let parentListbox = searchForRelatedElements(parentElement, [{
                    findParent: { attrName: "role", attrValue: "menu", maxDepth: 4 }
                }]);
                if (!parentListbox) {
                    return;
                }
                parentListbox = parentListbox[1];

                htmlNode = this.GetHTMLObjectNode(parentListbox, requestObject, frameInfo);
                htmlNode.objNode.Role = "ListView";
                if(tag == "combobox-menuitem") {
                    populateListViewChildren(htmlNode.objNode, parentListbox.querySelectorAll('*[role="menuitemradio"]'));
                }
                if(tag == "combobox-radioitem") {
                    populateListViewChildren(htmlNode.objNode, parentListbox.querySelectorAll('*[role="menuitem"]'));
                }
                htmlNode.objItem.ControlElement = parentElement;
                htmlNode.objItem.FillProperty(parentElement);
                htmlNode.objItem.Name = parentElement.innerText;
            }
            if (tag == "button") {
                htmlNode = this.GetHTMLObjectNode(parentElement, requestObject, frameInfo);
                htmlNode.objNode.Role = "Button";
            }
            else if (tag == "combobox-outer" || tag == "datebox-outer" || tag == "timebox-outer" || tag == "combobox-noinput") {
                htmlNode = this.GetHTMLObjectNode(parentElement, requestObject, frameInfo);
                htmlNode.objNode.Role = "ComboBox";
            }
            return htmlNode;
        }
    }

    this.ExecuteActionSelectItem = function (htmlElement, value, actionToExecute, htmlExecutor) {
        let parentListbox = searchForRelatedElements(htmlElement, [{
            findParent: { attrName: "role", attrValue: "listbox", maxDepth: 4 }
        }]);
        let childListElements;
        if (parentListbox) {
            parentListbox = parentListbox[1];
            childListElements = parentListbox.querySelectorAll('*[role="option"]');
        }
        else {
            parentListbox = searchForRelatedElements(htmlElement, [{
                findParent: { attrName: "role", attrValue: "menu", maxDepth: 4 }
            }]);
            if(parentListbox) {
                parentListbox = parentListbox[1];
                childListElements = parentListbox.querySelectorAll('*[role="menuitem"]');
                if(!childListElements) {
                    childListElements = parentListbox.querySelectorAll('*[role="menuitemradio"]');
                }
            }
        }
        if (parentListbox && childListElements) {
            let found = false;
            let listElement = findListViewItem(childListElements, actionToExecute, value);
            if (listElement) {
                simulateClickEvent(listElement);
                found = true;
            }
            let result = new HTMLResult();
            result.SetStatus(found);
            return result;
        }
    }
}

PageFramework.RegisterPageFramework(SalesforcePageFramework);
