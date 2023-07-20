function Context(port) {
    this.activeRequest = null;
    const context = this;

    this.beginRequest = function (originalRequest, port) {
        var request = originalRequest;
        if (originalRequest.charAt(0) !== '<') {
            request = JSON.parse(request);
        }

        if (context.activeRequest) {
            AALogger.warn(
                'context',
                'began new request, but one was previously unfinished.',
                'new: ', request, 'old', context.activeRequest
            );
            context.finalizeRequest();
        }
        context.activeRequest = {
            originalRequest: originalRequest,
            request: request,
            _timeoutTimerId: null,
            _port: port,
            _requestListeners: []
        };
    };

    /**
     * Sends a response to agent
     * and (optionally) finalizes an active request
     *
     * @param {Object}} agent response
     * @param {boolean} isFinal (optional) if not passed, the request will be finalized, else if isFinal is false, it will not finalize the request
     */
    this.sendResponse = function (response) {
        AALogger.info('context', 'sendResponse');

        if (!context.activeRequest) {
            AALogger.warn('context', 'responding to request, but none was active.');
            return;
        }

        const port = context.activeRequest._port;
        context.finalizeRequest();

        AALogger.log('messenger', 'sendResponse: ', response);

        if (response !== undefined) {
            port.postMessage(response);
        }
    };

    this.finalizeRequest = function() {
        if (!context.activeRequest) {
            return;
        }
        if (context.activeRequest._requestListeners) {
            for (var listener of context.activeRequest._requestListeners) {
                listener.unregister();
            }
        }
        if (context.activeRequest._timeoutTimerId) {
            clearTimeout(context.activeRequest._timeoutTimerId);
            context.activeRequest._timeoutTimerId = null;
        }

        context.activeRequest = null;
    };

    /**
     * Sets a timer which will finish the request with an error if expired.
     * The timer will do nothing if this is no longer the active request when fired.
     *
     * @param {String}} action string for the error message
     * @param {number} timeOutMs (optional) set the timeout (defaults to request.timeOutMs)
     */
    this.beginRequestTimeout = function(action, timeOutMs) {
        if (!context.activeRequest) {
            throw new Error('cannot setRequestTimeout outside of a request');
        }
        if (context.activeRequest._timeoutTimerId !== null) {
            throw new Error('setRequestTimeout: timeout already set');
        }
        const timeoutRequest = context.activeRequest;
        var millis = (timeOutMs ? timeOutMs : Number(context.activeRequest.request.timeOutMs) || 15000);
        var message = `Could not ${action} within ${Math.ceil(millis / 1000)} seconds`;

        var callback = function() {
            if (timeoutRequest === context.activeRequest) {
                context.sendResponse(message);
            }
        };
        context.activeRequest._timeoutTimerId = setTimeout(callback, millis, message);
    };

    this.clearRequestTimeout = function() {
        if (!context.activeRequest) {
            AALogger.warn('context', 'cannot clearRequestTimeout outside of a request');
        } else if (context.activeRequest && !context.activeRequest._timeoutTimerId) {
            AALogger.warn('context', 'clearRequestTimeout: timeout not set');
        } else {
            clearTimeout(context.activeRequest._timeoutTimerId);
            context.activeRequest._timeoutTimerId = null;
        }
    };

    /**
     * Registers an event listener to be cleaned up upon the end of the request (if not manually cleaned up earlier)
     * The listener will be called with `context` as it's first argument.
     * @param {Object} event
     * @param {function} callback
     * @returns
     */
    this.registerListenerDuringRequest = function(event, callback) {
        if (!context.activeRequest) {
            throw new Error('cannot registerListenerDuringRequest outside of a request');
        }
        const wrapListener = function(...args) {
            return callback(context, ...args);
        };
        const listenerInfo = {
            event: event,
            instance: wrapListener,
            registered: true,
            unregister: function() {
                if (!listenerInfo.registered) {
                    return;
                }
                event.removeListener(wrapListener);
                listenerInfo.registered = false;
            }
        };
        context.activeRequest._requestListeners.push(listenerInfo);
        event.addListener(wrapListener);
        return listenerInfo;
    };
}

try {
    module.exports = {
        Context
    };
} catch (e) { };
