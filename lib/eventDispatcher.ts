export class EventDispatcher {

    protected _eventDispatcherCallbacks: { [index: string]: { fn: (...args: any[]) => any, scope?: any, once?: boolean }[] };

    public on(event: string, fn: (...args: any[]) => any, scope?: any, once?: boolean): void {

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

    public once(event: string, fn?: (...args: any[]) => any, scope?: any): Promise<any> | void {

        if (fn) {
            this.on(event, fn, scope, true)
        }

        return new Promise((resolve, reject) => {
            fn = (...args: any[]) => resolve(args.length > 1 ? args : args[0])
            this.on(event, fn, scope, true)
        })


    }


    public un(event: string, fn: (...args: any[]) => any, scope?: any): void {

        if (!this._eventDispatcherCallbacks) {
            return
        }

        let callbacks = this._eventDispatcherCallbacks[event];

        if (!callbacks && callbacks.length) {
            return
        }

        for (let i = callbacks.length - 1; i >= 0; i--) {
            let callback = callbacks[i];
            if (callback.fn === fn && callback.scope === (scope || this)) {
                callbacks.splice(i, 1);
            }
        }


    }

    public fireEvent(event: string, ...args: any[]): void {

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


    public removeListenersByScope(scope: any): void {

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

    public removeAllListeners(): void {

        let keys = Object.keys(this._eventDispatcherCallbacks || {});
        for (let i = 0, length = keys.length; i < length; i++) {
            let callbacks = this._eventDispatcherCallbacks[keys[i]];
            callbacks.length = 0;
        }

        this._eventDispatcherCallbacks = {};
    }
}

