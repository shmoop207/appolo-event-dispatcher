"use strict";

import {IEventOptions} from "./IEventOptions";
import {EventDispatcher} from "./eventDispatcher";

export class Event<T> {

    constructor(private readonly _opts?: { await: boolean, parallel: boolean }) {

        this._opts = Object.assign({}, {await: false, parallel: true}, _opts)
    }

    private readonly EVENT_NAME = "event";

    private _eventEventDispatcher: EventDispatcher = new EventDispatcher();


    public on(fn: (payload: T) => any, scope?: any): void {
        this._eventEventDispatcher.on(this.EVENT_NAME, fn, scope, this._opts)
    }

    public un(fn: (payload: T) => any, scope?: any): void {
        this._eventEventDispatcher.un(this.EVENT_NAME, fn, scope)
    }

    public once(fn?: (payload: T) => any, scope?: any): Promise<any> | void {
        this._eventEventDispatcher.once(this.EVENT_NAME, fn, scope, this._opts);
    }

    public fireEvent(payload: T): Promise<any> {
        return this._eventEventDispatcher.fireEvent(this.EVENT_NAME, payload)
    }

    public removeAllListeners() {
        this._eventEventDispatcher.removeAllListeners();
    }

    public hasListener(fn?: (...args: any[]) => any, scope?: any): boolean {
        return this._eventEventDispatcher.hasListener(this.EVENT_NAME, fn, scope);
    }

    public listenerCount(): number {
        return this._eventEventDispatcher.listenerCount(this.EVENT_NAME);
    }
}


