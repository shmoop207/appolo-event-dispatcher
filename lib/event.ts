"use strict";

import {IEventOptions} from "./IEventOptions";
import {EventDispatcher} from "./eventDispatcher";
import {IEvent} from "./IEvent";

export class Event<T> implements IEvent<T> {

    constructor(private readonly _opts?: IEventOptions) {

        this._opts = Object.assign({}, {await: false, parallel: true}, _opts)
    }

    private readonly EVENT_NAME = "event";

    private _dispatcher: EventDispatcher = new EventDispatcher();


    public on(fn: (payload: T) => any, scope?: any,options: IEventOptions = {}): void {
        this._dispatcher.on(this.EVENT_NAME, fn, scope, {...options, ...this._opts})
    }

    public un(fn: (payload: T) => any, scope?: any): void {
        this._dispatcher.un(this.EVENT_NAME, fn, scope)
    }

    public once(fn?: (payload: T) => any, scope?: any, options: IEventOptions = {}): Promise<any> | void {
        return this._dispatcher.once(this.EVENT_NAME, fn, scope, {...options, ...this._opts});
    }

    public iterator<T>(event: string | string[], options?: { limit?: number }): AsyncIterableIterator<T> {
        return this._dispatcher.iterator(event, options);
    }

    public fireEvent(payload: T): void {
        this._dispatcher.fireEvent(this.EVENT_NAME, payload)
    }

    public fireEventAsync(payload: T): Promise<any> {
        return this._dispatcher.fireEventAsync(this.EVENT_NAME, payload)
    }

    public removeAllListeners() {
        this._dispatcher.removeAllListeners();
    }

    public hasListener(fn?: (...args: any[]) => any, scope?: any): boolean {
        return this._dispatcher.hasListener(this.EVENT_NAME, fn, scope);
    }

    public listenerCount(): number {
        return this._dispatcher.listenerCount(this.EVENT_NAME);
    }


}


