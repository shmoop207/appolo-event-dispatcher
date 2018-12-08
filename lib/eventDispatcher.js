"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CallbacksSymbol = Symbol('eventDispatcherCallbacks');
exports.CallbacksSymbol = CallbacksSymbol;
class EventDispatcher {
    on(event, fn, scope, options) {
        if (!this[CallbacksSymbol]) {
            this[CallbacksSymbol] = {};
        }
        let callbacks = this[CallbacksSymbol][event];
        if (!callbacks) {
            this[CallbacksSymbol][event] = callbacks = [];
        }
        callbacks.unshift({
            fn: fn,
            scope: scope,
            options: options || {}
        });
    }
    once(event, fn, scope, options = {}) {
        if (fn) {
            return this.on(event, fn, scope, Object.assign({}, options, { once: true }));
        }
        return new Promise((resolve) => {
            fn = (...args) => resolve(args.length > 1 ? args : args[0]);
            this.on(event, fn, scope, Object.assign({}, options, { once: true }));
        });
    }
    bubble(event, scope) {
        this.on(event, (...args) => scope.fireEvent(event, ...args));
    }
    un(event, fn, scope) {
        if (!this[CallbacksSymbol]) {
            return;
        }
        let callbacks = this[CallbacksSymbol][event];
        if (!callbacks || !callbacks.length) {
            return;
        }
        for (let i = callbacks.length - 1; i >= 0; i--) {
            let callback = callbacks[i];
            if (callback.fn === fn && (scope ? callback.scope === scope : true)) {
                callbacks.splice(i, 1);
            }
        }
    }
    fireEvent(event, ...args) {
        if (!this[CallbacksSymbol]) {
            return;
        }
        let callbacks = this[CallbacksSymbol][event];
        if (!callbacks) {
            return;
        }
        for (let i = callbacks.length - 1; i >= 0; i--) {
            let callback = callbacks[i];
            if (!callback || !callback.fn) {
                continue;
            }
            callback.fn.apply((callback.scope || null), args);
            if (callback.options.once) {
                callbacks.splice(i, 1);
            }
        }
    }
    removeListenersByScope(scope) {
        let keys = Object.keys(this[CallbacksSymbol] || {});
        for (let i = 0, length = keys.length; i < length; i++) {
            let callbacks = this[CallbacksSymbol][keys[i]];
            for (let j = callbacks.length - 1; j >= 0; j--) {
                let callback = callbacks[j];
                if (callback.scope === scope) {
                    callbacks.splice(j, 1);
                }
            }
        }
    }
    removeAllListeners() {
        let keys = Object.keys(this[CallbacksSymbol] || {});
        for (let i = 0, length = keys.length; i < length; i++) {
            let callbacks = this[CallbacksSymbol][keys[i]];
            callbacks.length = 0;
        }
        this[CallbacksSymbol] = {};
    }
    hasListener(event, fn, scope) {
        if (!this[CallbacksSymbol]) {
            return false;
        }
        let callbacks = this[CallbacksSymbol][event];
        if (!callbacks || !callbacks.length) {
            return false;
        }
        if (arguments.length == 1) {
            return true;
        }
        for (let i = callbacks.length - 1; i >= 0; i--) {
            let callback = callbacks[i];
            if (callback.fn === fn && (!scope || callback.scope === scope)) {
                return true;
            }
        }
        return false;
    }
}
exports.EventDispatcher = EventDispatcher;
//# sourceMappingURL=eventDispatcher.js.map