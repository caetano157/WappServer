function ListenableEvent(name) {
    const listeners = [];
    this.name = name;
    this._listeners = listeners;
    this.addListener = function(callback) {
        if (listeners.indexOf(callback) > -1) {
            throw new Error('adding listener that was already registered');
        }
        listeners.push(callback);
    };

    this.removeListener = function(callback) {
        if (listeners.pop(callback) === undefined) {
            throw new Error('removing listener that was not registered');
        }
    };

    this.fire = function(...args) {
        const results = [];
        for (var callback of listeners) {
            results.push(callback(...args));
        }
        return results;
    };
}

try {
    module.exports = {
        ListenableEvent
    };
} catch (e) { };
