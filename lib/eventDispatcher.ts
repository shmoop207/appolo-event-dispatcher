"use strict";

import {ICallback, IEventOptions} from "./IEventOptions";
import {IEventDispatcher} from "./IEventDispatcher";

const CallbacksSymbol: unique symbol = Symbol('eventDispatcherCallbacks');
export {CallbacksSymbol};

export class EventDispatcher implements IEventDispatcher {

    protected [CallbacksSymbol]: { [index: string]: ICallback[] };

    public on(event: string, fn: (...args: any[]) => any, scope?: any, options?: IEventOptions): void {

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

    public once(event: string, fn?: (...args: any[]) => any, scope?: any, options: IEventOptions = {}): Promise<any> | void {

        if (fn) {
            return this.on(event, fn, scope, {...options, ...{once: true}});
        }

        return new Promise((resolve) => {
            fn = (...args: any[]) => resolve(args.length > 1 ? args : args[0]);
            this.on(event, fn, scope, {...options, ...{once: true}})
        })

    }

    public bubble(event: string, scope: EventDispatcher) {
        this.on(event, (...args: any[]) => scope.fireEvent(event, ...args))
    }

    public un(event: string, fn: (...args: any[]) => any, scope?: any): void {

        if (!this[CallbacksSymbol]) {
            return
        }

        let callbacks = this[CallbacksSymbol][event];

        if (!callbacks || !callbacks.length) {
            return
        }

        for (let i = callbacks.length - 1; i >= 0; i--) {
            let callback = callbacks[i];
            if (callback.fn === fn && (scope ? callback.scope === scope : true)) {
                callbacks.splice(i, 1);
            }
        }
    }

    public fireEvent(event: string, ...args: any[]): void {

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

    public removeListenersByScope(scope: any): void {

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

    public removeAllListeners(): void {

        let keys = Object.keys(this[CallbacksSymbol] || {});
        for (let i = 0, length = keys.length; i < length; i++) {
            let callbacks = this[CallbacksSymbol][keys[i]];
            callbacks.length = 0;
        }

        this[CallbacksSymbol] = {};
    }
}

