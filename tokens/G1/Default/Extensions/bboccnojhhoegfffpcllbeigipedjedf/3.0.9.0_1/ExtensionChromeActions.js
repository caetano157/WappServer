// TABS
async function retrieveAllTabs() {
    const tabs = await chrome.tabs.query({});
    return tabs;
}

async function activateTabByTabId(tabId) {
    const updateProperties = { active: true };
    const tab = await chrome.tabs.update(tabId, updateProperties);
    return tab;
}

async function getActiveTab() {
    const tabOptions = { active: true, currentWindow: true };
    const tabs = await chrome.tabs.query(tabOptions);
    let tab = undefined;
    if (tabs && tabs.length > 0) {
        tab = tabs[0];
    }
    return tab;
}

async function getActiveTabs() {
    const tabOptions = { active: true, currentWindow: true };
    const tabs = await chrome.tabs.query(tabOptions);
    return tabs;
}

async function updateTab(tabId, tabQuery) {
    const tab = await chrome.tabs.update(tabId, tabQuery);
    return tab;
}

async function getTabById(tabId) {
    const tab = await chrome.tabs.get(tabId);
    return tab;
}

async function createTab(tabQuery) {
    const tab = await chrome.tabs.create(tabQuery);
    return tab;
}

async function removeTabById(tabId) {
    const tab = await chrome.tabs.remove(tabId);
    return tab;
}

// WINDOWS
async function retrieveAllWindows() {
    const query = { populate: true };
    const windows = await chrome.windows.getAll(query);
    return windows;
}

async function createWindowWithUrl(windowQuery) {
    const window = await chrome.windows.create(windowQuery);
    return window;
}

async function getCurrentWindow(windowQuery) {
    const window = await chrome.windows.getCurrent(windowQuery);
    return window;
}

async function removeWindowById(windowId) {
    const window = await chrome.windows.remove(windowId);
    return window;
}

// FRAMES
async function getAllFrames(tabId) {
    const framesQuery = { tabId: tabId };
    const frames = await chrome.webNavigation.getAllFrames(framesQuery);
    return frames;
}

async function getFrame(tabId, frameId) {
    const frameProperties = { tabId: tabId, frameId: frameId };
    var frame = await chrome.webNavigation.getFrame(frameProperties);
    return frame;
}

try {
    module.exports = {
        retrieveAllTabs,
        activateTabByTabId,
        getActiveTabs,
        getActiveTab,
        updateTab,
        getFrame,
        getAllFrames,
        createWindowWithUrl,
        createTab,
        updateTab,
        getTabById,
        removeWindowById,
        removeTabById,
        retrieveAllWindows,
        getCurrentWindow
    };
} catch (err) { }
