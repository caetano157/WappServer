(function () {
        if (window._automationanywhere_recorder_alert || window._automationanywhere_recorder_alert_closed) { return; }
        var alert = window.alert, confirm = window.confirm, prompt = window.prompt;
        const isNative = (o) => typeof o === 'function' && ("" + o).indexOf('{ [native code] }') >= 0;
        const createEvent = (name) => {
        if (isNative(window.Event)) {
            return new window.Event(name);
        }
        else if (isNative(document.createEvent)) {
            const event = document.createEvent('Event');
            event.initEvent(name, true, true);
            return event;
        }
        };
        const alertOpenEvent = createEvent('automationanywhere-recorder-alert');
        const alertCloseEvent = createEvent('automationanywhere-recorder-alert-closed');
        window.alert = function () {
            window.dispatchEvent(alertOpenEvent);
            var rvalue = alert.apply(this, arguments);
            window.dispatchEvent(alertCloseEvent);
            return rvalue;
        };
        window.confirm = function () {
            window.dispatchEvent(alertOpenEvent);
            var rvalue = confirm.apply(this, arguments);
            window.dispatchEvent(alertCloseEvent);
            return rvalue;
        };
        window.prompt = function () {
            window.dispatchEvent(alertOpenEvent);
            var rvalue = prompt.apply(this, arguments);
            window.dispatchEvent(alertCloseEvent);
            return rvalue;
        };
    }
)();
