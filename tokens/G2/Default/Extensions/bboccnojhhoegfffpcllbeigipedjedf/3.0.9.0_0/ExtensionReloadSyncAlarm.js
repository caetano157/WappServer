var installedTimestamp = null;

function startAAReloadAlarm() {
    chrome.alarms.clear('aaReloadAlarm');
    installedTimestamp = Date.now();
    chrome.alarms.create('aaReloadAlarm', { periodInMinutes: 1 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'aaReloadAlarm') {
        if (!installedTimestamp) {
            // if this alarm has fired but installedTimestamp has not been set (via onInstalled),
            // this service worker was restarted
            chrome.storage.local.get(['aaReloadLastInstalledTimestamp', 'aaReloadLastStoredContext']).
            then((result) => {
                AALogger.log('alarm', 'storage get', result);
                if (!result.aaReloadLastInstalledTimestamp || result.aaReloadLastInstalledTimestamp == installedTimestamp) {
                    AALogger.log('alarm', 'aaReloadLastInstalledTimestamp empty or matches');

                } else {
                    AALogger.log('alarm', 'aaReloadLastInstalledTimestamp is earlier, resyncing');
                    // todo: apply fields from last stored context
                    processReloadedStoredContext(result.aaReloadLastStoredContext);
                    return saveStoredContext();
                }
            }).catch((err) => {
                AALogger.log('alarm', 'error retrieving previous state', err);
            });
        } else {
            // if this alarm has fired and installedTimestamp is set, we are performing a periodic
            // refresh on an existing worker, and want to save our state for later resync in case the connection dies
            saveStoredContext();
        }
    }
});

function processReloadedStoredContext(lastStoredContext) {
    AALogger.log('alarm', 'last stored context:', lastStoredContext);
}

function saveStoredContext() {
    return chrome.storage.local.set({
            'aaReloadLastInstalledTimestamp': installedTimestamp,
            'aaReloadLastStoredContext': {}
        }).then((result) => {
            AALogger.log('alarm', 'set stored context');
        });
}

try {
    module.exports = {
        saveStoredContext,
        processReloadedStoredContext,
        startAAReloadAlarm
    };
} catch (e) { };
