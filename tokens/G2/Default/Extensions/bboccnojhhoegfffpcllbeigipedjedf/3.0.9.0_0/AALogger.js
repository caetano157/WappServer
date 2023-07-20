function AALogger(fileName, functionName, errorMessage) {
    /*
     This function does nothing under normal circumstances, but is kept
     for backwards compatibility.

     Use AALogger.log(category, message) instead
    */

    try {
        //var msg = fileName + '.' + functionName + ', ' + errorMessage;
        //console.log(msg);
    }
    catch (e) {

    }
}

AALogger.init = function() {
    var loggingConfiguration = AALogger.loggingConfiguration = {
        "enabled": false
    };

    function updateLoggingConfiguration(config) {
        console.log("Debug logging enabled", config);
        var logAll = !!config['enable_logging_all'];
        loggingConfiguration = {
            "enabled": true,
            "all": logAll,
            "levels": {
                "messenger": (logAll || !!config['enable_logging_messenger']),
                "script": (logAll || !!config['enable_logging_messenger'])
            }
        }
    }

    chrome.storage.sync.get(
        {
            "loggingConfiguration": false,
        },
        function (storedResult) {
            if (storedResult.loggingConfiguration) {
                var config = storedResult.loggingConfiguration;
                updateLoggingConfiguration(config);
            }
        }
    );
    chrome.storage.onChanged.addListener((change) => {
        if(change.loggingConfiguration) {
            if(!change.loggingConfiguration.newValue) {
                if(change.loggingConfiguration.oldValue) {
                    console.log("Debug logging disabled", change);
                }
                loggingConfiguration.enabled = false;
            }
            else {
                updateLoggingConfiguration(change.loggingConfiguration.newValue);
            }
        }
    });

    function makeLogger(consoleFn) {
        return function(category, message) {
            if(!loggingConfiguration || !loggingConfiguration.enabled) {
                return;
            }
            if(category in loggingConfiguration.levels) {
                if(!loggingConfiguration.levels[category]) {
                    return;
                }
            }
            else if (!loggingConfiguration.all) {
                return;
            }
            consoleFn(
                category + ": " + message,
                ...([...arguments].splice(2))
            );

        }
    }

    if(typeof(console) !== 'undefined' && console.log) {
        AALogger.log = makeLogger(console.log);
        AALogger.info = makeLogger(console.log);
        AALogger.warn = makeLogger(console.warn);
        AALogger.error = makeLogger(console.error);
    }
    else {
        AALogger.log = function() {};
        AALogger.info = function() {};
        AALogger.warn = function() {};
        AALogger.error = function() {};
    }
}

AALogger.init();
"";

try {
    module.exports = {
        AALogger
    };
} catch (e) { };



