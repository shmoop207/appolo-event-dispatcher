"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventDispatcher_1 = require("./eventDispatcher");
class Event {
    constructor() {
        this.EVENT_NAME = "event";
        this._eventEventDispatcher = new eventDispatcher_1.EventDispatcher();
    }
    on(fn, scope, options) {
        this._eventEventDispatcher.on(this.EVENT_NAME, fn, scope, options);
    }
    un(fn, scope) {
        this._eventEventDispatcher.un(this.EVENT_NAME, fn, scope);
    }
    once(fn, scope) {
        this._eventEventDispatcher.once(this.EVENT_NAME, fn, scope);
    }
    fireEvent(payload) {
        this._eventEventDispatcher.fireEvent(this.EVENT_NAME, payload);
    }
    removeAllListeners() {
        this._eventEventDispatcher.removeAllListeners();
    }
    hasListener(fn, scope) {
        return this._eventEventDispatcher.hasListener(this.EVENT_NAME, fn, scope);
    }
    listenerCount() {
        return this._eventEventDispatcher.listenerCount(this.EVENT_NAME);
    }
}
exports.Event = Event;
//# sourceMappingURL=event.js.map