"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routingKey_1 = require("./routingKey");
const iterator_1 = require("./iterator");
const CallbacksSymbol = '__eventDispatcherCallbacks__';
exports.CallbacksSymbol = CallbacksSymbol;
const RoutingKeysSymbol = '__eventDispatcherRoutingKeys__';
exports.RoutingKeysSymbol = RoutingKeysSymbol;
const RoutingKeysCacheSymbol = '__eventDispatcherRoutingKeysCache__';
class EventDispatcher {
    constructor(_eventDispatcherOptions) {
        this._eventDispatcherOptions = _eventDispatcherOptions;
        this._eventDispatcherOptions = Object.assign({}, { await: false, parallel: true }, this._eventDispatcherOptions);
    }
    on(event, fn, scope, options) {
        if (!this[CallbacksSymbol]) {
            this[CallbacksSymbol] = {};
        }
        let handler = this[CallbacksSymbol][event];
        if (!handler) {
            handler = this[CallbacksSymbol][event] = { callbacks: [], isRoutingKey: false, order: false };
        }
        handler.callbacks.unshift({
            fn: fn,
            scope: scope,
            options: Object.assign({ await: false, parallel: true, order: 0 }, this._eventDispatcherOptions, options)
        });
        if (options && options.order) {
            handler.callbacks.sort((a, b) => a.options.order - b.options.order);
        }
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
            return this.on(event, fn, scope, Object.assign(Object.assign({}, options), { once: true }));
        }
        return new Promise((resolve, reject) => {
            let timeout = null;
            fn = (...args) => {
                clearTimeout(timeout);
                resolve(args.length > 1 ? args : args[0]);
            };
            this.on(event, fn, scope, Object.assign(Object.assign({}, options), { once: true }));
            if (options.timeout) {
                timeout = setTimeout(() => reject(new Error("timeout")), options.timeout);
            }
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
    async fireEventAsync(event, ...args) {
        let result = this._fireEvent(event, args);
        if (!result) {
            return;
        }
        if (result.serialPromises.length) {
            for (let callback of result.serialPromises) {
                await callback.callback.fn.apply(callback.callback.scope, callback.args);
            }
        }
        if (result.parallelPromises.length) {
            await Promise.all(result.parallelPromises.map(callback => callback.callback.fn.apply(callback.callback.scope, callback.args)));
        }
        if (result.callbacks.length) {
            for (let callback of result.callbacks) {
                callback.callback.fn.apply(callback.callback.scope, callback.args);
            }
        }
    }
    fireEvent(event, ...args) {
        let result = this._fireEvent(event, args);
        if (!result) {
            return;
        }
        let callbacks = result.callbacks.concat(result.parallelPromises, result.serialPromises);
        for (let i = 0; i < callbacks.length; i++) {
            let callback = callbacks[i];
            callback.callback.fn.apply(callback.callback.scope, callback.args);
        }
    }
    _fireEvent(event, args) {
        if (!this[CallbacksSymbol]) {
            return;
        }
        let handler = this[CallbacksSymbol][event];
        let parallelPromises = [], serialPromises = [], callbacks = [];
        let routingKeys = this._eventDispatcherGetRoutingKeys(handler, event);
        if (routingKeys.length) {
            for (let i = 0, len = routingKeys.length; i < len; i++) {
                parallelPromises.push({
                    callback: {
                        fn: this.fireEvent,
                        scope: this
                    }, args: [routingKeys[i], ...args]
                });
            }
        }
        if (!handler) {
            return { callbacks, serialPromises, parallelPromises };
        }
        for (let i = handler.callbacks.length - 1; i >= 0; i--) {
            let callback = handler.callbacks[i];
            if (!callback || !callback.fn) {
                continue;
            }
            //callback.fn.apply((callback.scope || null), args);
            if (callback.options.await) {
                if (callback.options.parallel) {
                    parallelPromises.push({ callback, args });
                }
                else {
                    serialPromises.push({ callback, args });
                }
            }
            else {
                callbacks.push({ callback, args });
            }
            if (callback.options.once) {
                handler.callbacks.splice(i, 1);
                if (!handler.callbacks.length && this[RoutingKeysSymbol] && this[RoutingKeysSymbol][event]) {
                    this[RoutingKeysSymbol][event] = undefined;
                    this[RoutingKeysCacheSymbol] = Object.keys(this[RoutingKeysSymbol]);
                }
            }
        }
        return { callbacks, serialPromises, parallelPromises };
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
    iterator(event, options) {
        let iterator = new iterator_1.Iterator(this, event, options);
        return iterator.iterate();
    }
}
exports.EventDispatcher = EventDispatcher;
//# sourceMappingURL=eventDispatcher.js.map