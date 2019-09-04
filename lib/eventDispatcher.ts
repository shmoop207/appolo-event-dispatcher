"use strict";

import {ICallback, IEventOptions, IHandler} from "./IEventOptions";
import {IEventDispatcher} from "./IEventDispatcher";
import {RoutingKey} from "./routingKey";

const CallbacksSymbol: unique symbol = Symbol('eventDispatcherCallbacks');
const RoutingKeysSymbol: unique symbol = Symbol('eventDispatcherRoutingKeys');
const RoutingKeysCacheSymbol: unique symbol = Symbol('eventDispatcherRoutingKeysCache');
export {CallbacksSymbol, RoutingKeysSymbol};

export class EventDispatcher implements IEventDispatcher {

    constructor(private readonly _eventDispatcherOptions?: { await?: boolean, parallel?: boolean }) {

        this._eventDispatcherOptions = Object.assign({}, {await: false, parallel: true}, this._eventDispatcherOptions)
    }

    protected [CallbacksSymbol]: { [index: string]: IHandler };
    protected [RoutingKeysSymbol]: { [index: string]: { key: string, regex: RegExp, cache: { [index: string]: boolean } } };

    public on(event: string, fn: (...args: any[]) => any, scope?: any, options?: IEventOptions): void {

        if (!this[CallbacksSymbol]) {
            this[CallbacksSymbol] = {};
        }

        let handler = this[CallbacksSymbol][event];

        if (!handler) {
            handler = this[CallbacksSymbol][event] = {callbacks: [], isRoutingKey: false};
        }

        handler.callbacks.unshift({
            fn: fn,
            scope: scope,
            options: Object.assign({await: false, parallel: true}, this._eventDispatcherOptions, options)
        });

        if (!handler.isRoutingKey && RoutingKey.isRoutingRoute(event)) {
            if (!this[RoutingKeysSymbol]) {
                this[RoutingKeysSymbol] = {};
                this[RoutingKeysCacheSymbol] = [];
            }

            handler.isRoutingKey = true;

            this[RoutingKeysSymbol][event] = {regex: RoutingKey.createRegex(event), key: event, cache: {}};

            this[RoutingKeysCacheSymbol] = Object.keys(this[RoutingKeysSymbol]);

        }

    }

    public once(event: string, fn?: (...args: any[]) => any, scope?: any, options: IEventOptions = {}): Promise<any> | void {

        if (fn) {
            return this.on(event, fn, scope, {...options, ...{once: true}});
        }

        return new Promise((resolve) => {
            fn = (...args: any[]) => resolve(args.length > 1 ? args : args[0]);
            this.on(event, fn, scope, {...options, ...{once: true}})
        })

    }

    public bubble(event: string, scope: IEventDispatcher) {
        this.on(event, (...args: any[]) => scope.fireEvent(event, ...args))
    }

    public un(event: string, fn: (...args: any[]) => any, scope?: any): void {

        if (!this[CallbacksSymbol]) {
            return
        }

        let handler = this[CallbacksSymbol][event];

        if (!handler || !handler.callbacks.length) {
            return
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

    public async fireEvent(event: string, ...args: any[]): Promise<any> {

        if (!this[CallbacksSymbol]) {
            return;
        }

        let handler = this[CallbacksSymbol][event];
        let parallelPromises: Promise<any>[] = [];

        let routingKeys = this._eventDispatcherGetRoutingKeys(handler, event);

        if (routingKeys.length) {
            for (let i = 0, len = routingKeys.length; i < len; i++) {
                parallelPromises.push(this.fireEvent(routingKeys[i], ...args))
            }
        }


        if (handler) {
            for (let i = handler.callbacks.length - 1; i >= 0; i--) {
                let callback = handler.callbacks[i];

                if (!callback || !callback.fn) {
                    continue;
                }

                let result = callback.fn.apply((callback.scope || null), args);

                if (callback.options.once) {
                    handler.callbacks.splice(i, 1);

                    if (!handler.callbacks.length && this[RoutingKeysSymbol] && this[RoutingKeysSymbol][event]) {
                        this[RoutingKeysSymbol][event] = undefined;
                        this[RoutingKeysCacheSymbol] = Object.keys(this[RoutingKeysSymbol]);
                    }
                }

                if (callback.options.await) {
                    if (callback.options.parallel) {
                        parallelPromises.push(result)
                    } else {
                        await result;
                    }
                }
            }
        }

        if (parallelPromises.length) {

            await Promise.all(parallelPromises)
        }
    }

    private _eventDispatcherGetRoutingKeys(handler: IHandler, event: string): string[] {

        if ((handler && handler.isRoutingKey) || !this[RoutingKeysSymbol]) {
            return [];
        }

        let keys = [],
            routingKeysIndex = this[RoutingKeysSymbol],
            routingKeys = this[RoutingKeysCacheSymbol];

        for (let i = 0, len = routingKeys.length; i < len; i++) {
            let routingKey = routingKeysIndex[routingKeys[i]];

            if (!routingKey) {
                continue;
            }

            let cacheKey = routingKey.key + event;

            let shouldFireEvent = routingKey.cache[cacheKey];

            if (shouldFireEvent === undefined) {
                shouldFireEvent = routingKey.cache[cacheKey] = routingKey.regex.test(event)
            }

            if (shouldFireEvent) {
                keys.push(routingKey.key)
            }
        }

        return keys;
    }


    public removeListenersByScope(scope: any): void {

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

    public removeAllListeners(): void {

        let keys = Object.keys(this[CallbacksSymbol] || {});
        for (let i = 0, length = keys.length; i < length; i++) {
            let handler = this[CallbacksSymbol][keys[i]];
            handler.callbacks.length = 0;
        }

        this[CallbacksSymbol] = {};
        this[RoutingKeysSymbol] = undefined;
        this[RoutingKeysCacheSymbol] = undefined

    }

    public hasListener(event: string, fn ?: (...args: any[]) => any, scope ?: any): boolean {
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

        return false

    }

    public listenerCount(event: string): number {
        let handler = this[CallbacksSymbol][event],
            sum = 0;

        let routingKeys = this._eventDispatcherGetRoutingKeys(handler, event);

        if (routingKeys.length) {
            for (let i = 0, len = routingKeys.length; i < len; i++) {
                sum += this.listenerCount(routingKeys[i]);
            }
        }

        if (!handler) {
            return sum;
        }

        return sum + handler.callbacks.length
    }
}

