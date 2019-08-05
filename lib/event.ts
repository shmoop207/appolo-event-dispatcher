"use strict";

import {IEventOptions} from "./IEventOptions";
import {EventDispatcher} from "./eventDispatcher";

export class Event<T> {
    private readonly EVENT_NAME = "event";

    private _eventEventDispatcher: EventDispatcher = new EventDispatcher();


    public on(fn: (payload: T) => any, scope?: any, options?: IEventOptions): void {
        this._eventEventDispatcher.on(this.EVENT_NAME, fn, scope, options)
    }

    public un(fn: (payload: T) => any, scope?: any): void {
        this._eventEventDispatcher.un(this.EVENT_NAME, fn, scope)
    }

    public once(fn?: (payload: T) => any, scope?: any): Promise<any> | void {
        this._eventEventDispatcher.once(this.EVENT_NAME, fn, scope);
    }

    public fireEvent(payload: T): void {
        this._eventEventDispatcher.fireEvent(this.EVENT_NAME, payload)
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


