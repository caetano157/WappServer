async function addTrigger (context, message) {
    context.triggers.triggerRegistry.set(message.registerTrigger.uiEventId, message.registerTrigger);
    var windowTitle = getWindowTitleFromRequest(message.registerTrigger);
    // Check if any existing tab matches request window title
    var tabs = await retrieveAllTabs();
    for (var tabIndex = 0; tabIndex < tabs.length; tabIndex++) {
        if (tabs[tabIndex].title === windowTitle) {
            var tabId = tabs[tabIndex].id;
            AALogger.log('trigger', 'executing content script on:', windowTitle);
            chrome.tabs.sendMessage(tabId, message, () => checkChromeError());
            if (context.triggers.triggerTabRegistry.has(message.registerTrigger.uiEventId)) {
                context.triggers.triggerTabRegistry.get(message.registerTrigger.uiEventId).push(tabId);
            } else {
                context.triggers.triggerTabRegistry.set(message.registerTrigger.uiEventId, [tabId]);
            }
        }
    }
    AALogger.log('trigger', 'Trigger registered for client:', message.registerTrigger.uiEventId);
    if (context.triggers.windowTitleJournal.has(windowTitle)) {
        context.triggers.windowTitleJournal.get(windowTitle).push(message.registerTrigger.uiEventId);
    } else {
        context.triggers.windowTitleJournal.set(windowTitle, [message.registerTrigger.uiEventId]);
    }
    startOnMessageListener(context);
    context.sendResponse(getTriggerResponse(message.registerTrigger.uiEventId, 'register'));
}

function removeTrigger(context, message) {
    if (context.triggers.triggerTabRegistry.has(message.unregisterTrigger.uiEventId)) {
        context.triggers.triggerTabRegistry.get(message.unregisterTrigger.uiEventId).forEach((tabId) => {
            chrome.tabs.sendMessage(tabId, message, () => checkChromeError());
        });
        removeEventFromWindowJournal(context, message.unregisterTrigger.uiEventId);
        context.triggers.triggerRegistry.delete(message.unregisterTrigger.uiEventId);
        context.triggers.triggerTabRegistry.delete(message.unregisterTrigger.uiEventId);
        context.sendResponse(getTriggerResponse(message.unregisterTrigger.uiEventId, 'unregister'));
    }
}

function removeEventFromWindowJournal(context, uiEventId) {
    if (context.triggers.triggerRegistry.has(uiEventId)) {
        var registerTrigger = context.triggers.triggerRegistry.get(uiEventId);
        var windowTitle = getWindowTitleFromRequest(registerTrigger);
        context.triggers.windowTitleJournal.get(windowTitle).pop(uiEventId);
    }
}

function startOnMessageListener(context) {
    if (!context.triggers.isTriggerListenerRegistered) {
        // trigger events are an unusual case of a postMessage not linked to a request/response pair
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (context.triggers.triggerRegistry.has(request.uiEventId)) {
                AALogger.log('trigger', `response callback from content script: ${JSON.stringify(request)}`);
                context._port.postMessage(getTriggerResponse(request.uiEventId, 'event'));
                sendResponse(true);
            }
        });
        context.triggers.isTriggerListenerRegistered = true;
        AALogger.log('trigger', 'Listener registered..');
    } else {
        AALogger.log('trigger', 'Listener already registered..');
    }
}

/**
 * This will handle case where tab was not matching window title earlier and
 * internal navigation changes window title to something matching
 */
function handleTriggerOnWindowOnUpdate(context, tabId, changeInfo, tab) {
    if (tab.status === HTMLDocumentStatus.COMPLETE && context.triggers.windowTitleJournal.has(tab.title)) {
        var uiEventIds = context.triggers.windowTitleJournal.get(tab.title);
        uiEventIds.forEach((uiEventId) => {
            var registerTrigger = context.triggers.triggerRegistry.get(uiEventId);
            chrome.tabs.sendMessage(tabId, getTriggerRegisterRequest(registerTrigger), () => checkChromeError());
            if (context.triggers.triggerTabRegistry.has(uiEventId)) {
                context.triggers.triggerTabRegistry.get(uiEventId).push(tabId);
            } else {
                context.triggers.triggerTabRegistry.set(uiEventId, [tabId]);
            }
        });
    } else {
        // This will identify a registered trigger window that isn't matching anymore.
        context.triggers.triggerTabRegistry.forEach((tabIds, uiEventId) => {
            if (tabIds.includes(tabId)) {
                var windowTitle = getWindowTitleFromRequest(context.triggers.triggerRegistry.get(uiEventId));
                if (tab.status === HTMLDocumentStatus.COMPLETE && tab.title !== windowTitle) {
                    var unregisterRequest = getTriggerUnregisterRequest(uiEventId);
                    chrome.tabs.sendMessage(tabId, unregisterRequest, () => checkChromeError());
                    tabIds.pop(tabId);
                }
            }
        });
    }
}

function removeTabFromTriggerRegistry(context, tabId) {
    context.triggers.triggerTabRegistry.forEach((tabIds, uiEventId) => {
        if (tabIds.includes(tabId)) {
            tabIds.pop(tabId);
        }
    });
}

function getWindowTitleFromRequest(registerTrigger) {
    return registerTrigger.uiEventRequest.uiobjectWindow.window.name;
}

function getTriggerResponse(uiEventId, type) {
    var browserResponse = {
        triggerResponse: {
            uiEventId: uiEventId,
            type: type
        }
    };
    return browserResponse;
}

function getTriggerRegisterRequest(triggerRequest) {
    var browserRequest = {
        registerTrigger: triggerRequest
    };
    return browserRequest;
}

function getTriggerUnregisterRequest(uiEventId) {
    var browserRequest = {
        unregisterTrigger: {
            uiEventId: uiEventId
        }
    };
    return browserRequest;
}

try {
    module.exports = {
        startOnMessageListener,
        removeTrigger,
        addTrigger,
        removeTabFromTriggerRegistry,
        getWindowTitleFromRequest,
        getTriggerUnregisterRequest,
        getTriggerRegisterRequest,
        handleTriggerOnWindowOnUpdate,
        removeEventFromWindowJournal,
        getTriggerResponse
    };
} catch (err) { }
