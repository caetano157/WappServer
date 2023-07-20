let triggerListenerAdded = false;
const OPTIONS_CAPTURE_PASSIVE = { capture: true, passive: true };
var htmlTrigger = new HTMLTrigger();

function addTriggerListener() {
    if (!triggerListenerAdded) {
        AALogger.log("trigger", 'adding on message listener for aa chrome trigger content script');
        chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
            if (message.registerTrigger) {
                // The keymap is mapping between chrome keycode and keyname AA maintains. They keyname chrome maintains isnt exactly same as we do
                // e.g. 'NUM_SLASH' for AA is 'division' for chrome
                const keyMap = new Map([
                    ['BACKSPACE', 8],
                    ['TAB', 9],
                    ['ENTER', 13],
                    ['SHIFT', 16],
                    ['CTRL', 17],
                    ['ALTR', 18],
                    ['CAPS_LOCK', 20],
                    ['ESCAPE', 27],
                    ['SPACE', 32],
                    ['PAGE_UP', 33],
                    ['PAGE_DOWN', 34],
                    ['END', 35],
                    ['HOME', 36],
                    ['ARROW_LEFT', 37],
                    ['ARROW_UP', 38],
                    ['ARROW_RIGHT', 39],
                    ['ARROW_DOWN', 40],
                    ['INSERT', 45],
                    ['DELETE', 46],
                    ['0', 48],
                    ['1', 49],
                    ['2', 50],
                    ['3', 51],
                    ['4', 52],
                    ['5', 53],
                    ['6', 54],
                    ['7', 55],
                    ['8', 56],
                    ['9', 57],
                    ['A', 65],
                    ['B', 66],
                    ['C', 67],
                    ['D', 68],
                    ['E', 69],
                    ['F', 70],
                    ['G', 71],
                    ['H', 72],
                    ['I', 73],
                    ['J', 74],
                    ['K', 75],
                    ['L', 76],
                    ['M', 77],
                    ['N', 78],
                    ['O', 79],
                    ['P', 80],
                    ['Q', 81],
                    ['R', 82],
                    ['S', 83],
                    ['T', 84],
                    ['U', 85],
                    ['V', 86],
                    ['W', 87],
                    ['X', 88],
                    ['Y', 89],
                    ['Z', 90],
                    ['NUM_0', 96],
                    ['NUM_1', 97],
                    ['NUM_2', 98],
                    ['NUM_3', 99],
                    ['NUM_4', 100],
                    ['NUM_5', 101],
                    ['NUM_6', 102],
                    ['NUM_7', 103],
                    ['NUM_8', 104],
                    ['NUM_9', 105],
                    ['NUM_START', 106],
                    ['NUM_PLUS', 107],
                    ['NUM_MINUS', 109],
                    ['NUM_DOT', 110],
                    ['NUM_SLASH', 111],
                    ['F1', 112],
                    ['F2', 113],
                    ['F3', 114],
                    ['F4', 115],
                    ['F5', 116],
                    ['F6', 117],
                    ['F7', 118],
                    ['F8', 119],
                    ['F9', 120],
                    ['F10', 121],
                    ['F11', 122],
                    ['F12', 123],
                    ['NUM_LOCK', 144],
                    [';', 186],
                    ['=', 187],
                    [',', 188],
                    ['-', 189],
                    ['.', 190],
                    ['/', 191],
                    ['\\', 220],
                    ['\'', 222]
                ]);
                htmlTrigger.registerUIEvent(message, elementClickEvent, keyMap, OPTIONS_CAPTURE_PASSIVE);
            } else if (message.unregisterTrigger) {
                htmlTrigger.unregisterUIEvent(message, elementClickEvent, OPTIONS_CAPTURE_PASSIVE);
            }
        });
        triggerListenerAdded = true;
        AALogger.log("trigger", 'chrome trigger listener added');
    } else {
        AALogger.log("trigger", 'aa chrome trigger content script already registered');
    }
}

function elementClickEvent(event) {
    var start = performance.now();
    var matchedEventIds = htmlTrigger.getMatchedUIEventIds(event);
    matchedEventIds.forEach((uiEventId) => {
        AALogger.log("trigger",`Sending callback to content script for event id ${uiEventId}`);
        chrome.runtime.sendMessage({
            uiEventId: uiEventId
        }, () => checkChromeError());
    });
    var end = performance.now();
    AALogger.log("trigger", `elementClickEvent: ${end - start} ms`);
}
