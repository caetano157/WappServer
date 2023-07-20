// names of keys in the logging option settings
var loggingOptionKeys = [
    'enable_logging_all',
    'enable_logging_messenger',
    'enable_logging_script'
];

var supportedChromeVersion = 91;

// Saves options to chrome.storage
function save_options() {
    var loggingOptions = false;
    var enableLogging = document.getElementById('enable_logging').checked;

    // We show this checkbox as "enable", but the stored flag is "disable"
    var disableNativeMessaging = !(document.getElementById('enable_native_messaging').checked);
    if (enableLogging) {
        loggingOptions = {};
        for (var key of loggingOptionKeys) {
            loggingOptions[key] = document.getElementById(key).checked;
        }
    }
    document.getElementById('loading_overlay').setAttribute('style', 'visibility: visible; opacity: 1');
    console.log("save_options setting result", loggingOptions);
    chrome.storage.sync.set(
        {
            "loggingConfiguration": loggingOptions,
            "disableNativeMessaging": disableNativeMessaging
        },
        function() {
            // Update status to let user know options were saved.
            var saveButton = document.getElementById('save');
            saveButton.textContent = 'Options saved!';
            document.getElementById('loading_overlay').setAttribute('style', '');
            setTimeout(function() {
                saveButton.textContent = 'Save';
            }, 750);
        }
    );
}

function getChromeVersion() {
    var raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
    return raw ? parseInt(raw[2], 10) : false;
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    var isInvalidBrowser = getChromeVersion() < supportedChromeVersion;
    chrome.storage.sync.get(
        {
            "loggingConfiguration": false,
            "disableNativeMessaging": false
        },
        function(storedResult) {
            console.log("restore_options result", storedResult.loggingConfiguration, storedResult.disableNativeMessaging);
            if (storedResult.loggingConfiguration) {
                document.getElementById('enable_logging').checked = true;
                for (var key of loggingOptionKeys) {
                    document.getElementById(key).checked = !!(storedResult.loggingConfiguration[key]);
                }
                document.getElementById('enable_logging_details').setAttribute('class', 'section-enabled');
            } else {
                document.getElementById('enable_logging').checked = false;
                for (var key of loggingOptionKeys) {
                    document.getElementById(key).checked = false;
                }
                document.getElementById('enable_logging_details').setAttribute('class', 'section-disabled');
            }

            document.getElementById('enable_native_messaging').checked = !storedResult.disableNativeMessaging;

            if (isInvalidBrowser) {
                document.getElementById('save').setAttribute('style', 'background: #dddddd !important') ;
                document.getElementById('save').setAttribute('disabled', true);
                document.getElementById('warning').setAttribute('style', 'display: block');
                document.getElementById('enable_native_messaging').setAttribute('disabled', true);
            } else {
                document.getElementById('warning').setAttribute('style', 'display: none');
            }

            document.getElementById('options').setAttribute('style', 'visibility: visible');
        }
    );
    document.getElementById('enable_logging').addEventListener('change', function() {
        if (document.getElementById('enable_logging').checked) {
            document.getElementById('enable_logging_details').setAttribute('class', 'section-enabled');
            for (var el of document.querySelectorAll("#enable_logging_details input")) {
                el.removeAttribute("disabled");
            }
        } else {
            document.getElementById('enable_logging_details').setAttribute('class', 'section-disabled');
            for (var el of document.querySelectorAll("#enable_logging_details input")) {
                el.checked = false;
                el.setAttribute("disabled", "disabled");
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
