"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EventDispatcher {
    on(event, fn, scope, once) {
        if (!this._eventDispatcherCallbacks) {
            this._eventDispatcherCallbacks = {};
        }
        let callbacks = this._eventDispatcherCallbacks[event];
        if (!callbacks) {
            this._eventDispatcherCallbacks[event] = callbacks = [];
        }
        callbacks.push({
            fn: fn,
            scope: (scope || this),
            once: once || false
        });
    }
    once(event, fn, scope) {
        if (fn) {
            return this.on(event, fn, scope, true);
        }
        return new Promise((resolve, reject) => {
            fn = (...args) => resolve(args.length > 1 ? args : args[0]);
            this.on(event, fn, scope, true);
        });
    }
    un(event, fn, scope) {
        if (!this._eventDispatcherCallbacks) {
            return;
        }
        let callbacks = this._eventDispatcherCallbacks[event];
        if (!callbacks && callbacks.length) {
            return;
        }
        for (let i = callbacks.length - 1; i >= 0; i--) {
            let callback = callbacks[i];
            if (callback.fn === fn && callback.scope === (scope || this)) {
                callbacks.splice(i, 1);
            }
        }
    }
    fireEvent(event, ...args) {
        if (!this._eventDispatcherCallbacks) {
            return;
        }
        let callbacks = this._eventDispatcherCallbacks[event];
        if (!callbacks) {
            return;
        }
        for (let i = callbacks.length - 1; i >= 0; i--) {
            let callback = callbacks[i];
            if (!callback || !callback.fn || !callback.scope) {
                continue;
            }
            callback.fn.apply((callback.scope || this), args);
            if (callback.once) {
                callbacks.splice(i, 1);
            }
        }
    }
    removeListenersByScope(scope) {
        let keys = Object.keys(this._eventDispatcherCallbacks || {});
        for (let i = 0, length = keys.length; i < length; i++) {
            let callbacks = this._eventDispatcherCallbacks[keys[i]];
            for (let j = callbacks.length - 1; j >= 0; j--) {
                let callback = callbacks[j];
                if (callback.scope === scope) {
                    callbacks.splice(j, 1);
                }
            }
        }
    }
    removeAllListeners() {
        let keys = Object.keys(this._eventDispatcherCallbacks || {});
        for (let i = 0, length = keys.length; i < length; i++) {
            let callbacks = this._eventDispatcherCallbacks[keys[i]];
            callbacks.length = 0;
        }
        this._eventDispatcherCallbacks = {};
    }
}
exports.EventDispatcher = EventDispatcher;
//# sourceMappingURL=eventDispatcher.js.map