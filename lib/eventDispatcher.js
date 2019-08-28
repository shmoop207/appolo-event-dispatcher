"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routingKey_1 = require("./routingKey");
const CallbacksSymbol = Symbol('eventDispatcherCallbacks');
exports.CallbacksSymbol = CallbacksSymbol;
const RoutingKeysSymbol = Symbol('eventDispatcherRoutingKeys');
exports.RoutingKeysSymbol = RoutingKeysSymbol;
const RoutingKeysCacheSymbol = Symbol('eventDispatcherRoutingKeysCache');
class EventDispatcher {
    on(event, fn, scope, options) {
        if (!this[CallbacksSymbol]) {
            this[CallbacksSymbol] = {};
        }
        let handler = this[CallbacksSymbol][event];
        if (!handler) {
            handler = this[CallbacksSymbol][event] = { callbacks: [], isRoutingKey: false };
        }
        handler.callbacks.unshift({
            fn: fn,
            scope: scope,
            options: options || {}
        });
        if (!handler.isRoutingKey && routingKey_1.RoutingKey.isRoutingRoute(event)) {
            if (!this[RoutingKeysSymbol]) {
                this[RoutingKeysSymbol] = {};
                this[RoutingKeysCacheSymbol] = [];
            }
            handler.isRoutingKey = true;
            this[RoutingKeysSymbol][event] = { regex: routingKey_1.RoutingKey.createRegex(event), key: event, cache: {} };
            this[RoutingKeysCacheSymbol] = Object.keys(this[RoutingKeysSymbol]);
        }
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
        let handler = this[CallbacksSymbol][event];
        if (!handler || !handler.callbacks.length) {
            return;
        }
        for (let i = handler.callbacks.length - 1; i >= 0; i--) {
            let callback = handler.callbacks[i];
            if (callback.fn === fn && (scope ? callback.scope === scope : true)) {
                handler.callbacks.splice(i, 1);
            }
        }
        if (!handler.callbacks.length && this[RoutingKeysSymbol] && this[RoutingKeysSymbol][event]) {
            this[RoutingKeysSymbol][event] = undefined;
            this[RoutingKeysCacheSymbol] = Object.keys(this[RoutingKeysSymbol]);
        }
    }
    fireEvent(event, ...args) {
        if (!this[CallbacksSymbol]) {
            return;
        }
        let handler = this[CallbacksSymbol][event];
        let routingKeys = this._eventDispatcherGetRoutingKeys(handler, event);
        if (routingKeys.length) {
            for (let i = 0, len = routingKeys.length; i < len; i++) {
                this.fireEvent(routingKeys[i], ...args);
            }
        }
        if (!handler) {
            return;
        }
        for (let i = handler.callbacks.length - 1; i >= 0; i--) {
            let callback = handler.callbacks[i];
            if (!callback || !callback.fn) {
                continue;
            }
            callback.fn.apply((callback.scope || null), args);
            if (callback.options.once) {
                handler.callbacks.splice(i, 1);
                if (!handler.callbacks.length && this[RoutingKeysSymbol] && this[RoutingKeysSymbol][event]) {
                    this[RoutingKeysSymbol][event] = undefined;
                    this[RoutingKeysCacheSymbol] = Object.keys(this[RoutingKeysSymbol]);
                }
            }
        }
    }
    _eventDispatcherGetRoutingKeys(handler, event) {
        if ((handler && handler.isRoutingKey) || !this[RoutingKeysSymbol]) {
            return [];
        }
        let keys = [], routingKeysIndex = this[RoutingKeysSymbol], routingKeys = this[RoutingKeysCacheSymbol];
        for (let i = 0, len = routingKeys.length; i < len; i++) {
            let routingKey = routingKeysIndex[routingKeys[i]];
            if (!routingKey) {
                continue;
            }
            let cacheKey = routingKey.key + event;
            let shouldFireEvent = routingKey.cache[cacheKey];
            if (shouldFireEvent === undefined) {
                shouldFireEvent = routingKey.cache[cacheKey] = routingKey.regex.test(event);
            }
            if (shouldFireEvent) {
                keys.push(routingKey.key);
            }
        }
        return keys;
    }
    removeListenersByScope(scope) {
        let keys = Object.keys(this[CallbacksSymbol] || {});
        for (let i = 0, length = keys.length; i < length; i++) {
            let handler = this[CallbacksSymbol][keys[i]];
            for (let j = handler.callbacks.length - 1; j >= 0; j--) {
                let callback = handler.callbacks[j];
                if (callback.scope === scope) {
                    handler.callbacks.splice(j, 1);
                }
            }
        }
    }
    removeAllListeners() {
        let keys = Object.keys(this[CallbacksSymbol] || {});
        for (let i = 0, length = keys.length; i < length; i++) {
            let handler = this[CallbacksSymbol][keys[i]];
            handler.callbacks.length = 0;
        }
        this[CallbacksSymbol] = {};
        this[RoutingKeysSymbol] = undefined;
        this[RoutingKeysCacheSymbol] = undefined;
    }
    hasListener(event, fn, scope) {
        if (!this[CallbacksSymbol]) {
            return false;
        }
        let handler = this[CallbacksSymbol][event];
        let routingKeys = this._eventDispatcherGetRoutingKeys(handler, event);
        if (routingKeys.length) {
            for (let i = 0, len = routingKeys.length; i < len; i++) {
                if (this.hasListener(routingKeys[i], fn, scope)) {
                    return true;
                }
            }
        }
        if (!handler || !handler.callbacks.length) {
            return false;
        }
        if (arguments.length == 1 || !fn) {
            return true;
        }
        for (let i = handler.callbacks.length - 1; i >= 0; i--) {
            let callback = handler.callbacks[i];
            if (callback.fn === fn && (!scope || callback.scope === scope)) {
                return true;
            }
        }
        return false;
    }
    listenerCount(event) {
        let handler = this[CallbacksSymbol][event], sum = 0;
        let routingKeys = this._eventDispatcherGetRoutingKeys(handler, event);
        if (routingKeys.length) {
            for (let i = 0, len = routingKeys.length; i < len; i++) {
                sum += this.listenerCount(routingKeys[i]);
            }
        }
        if (!handler) {
            return sum;
        }
        return sum + handler.callbacks.length;
    }
}
exports.EventDispatcher = EventDispatcher;
//# sourceMappingURL=eventDispatcher.js.map