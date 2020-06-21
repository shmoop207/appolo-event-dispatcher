"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventDispatcher_1 = require("./eventDispatcher");
class Event {
    constructor(_opts) {
        this._opts = _opts;
        this.EVENT_NAME = "event";
        this._dispatcher = new eventDispatcher_1.EventDispatcher();
        this._opts = Object.assign({}, { await: false, parallel: true }, _opts);
    }
    on(fn, scope, options = {}) {
        this._dispatcher.on(this.EVENT_NAME, fn, scope, Object.assign(Object.assign({}, options), this._opts));
    }
    un(fn, scope) {
        this._dispatcher.un(this.EVENT_NAME, fn, scope);
    }
    once(fn, scope, options = {}) {
        return this._dispatcher.once(this.EVENT_NAME, fn, scope, Object.assign(Object.assign({}, options), this._opts));
    }
    iterator(event, options) {
        return this._dispatcher.iterator(event, options);
    }
    fireEvent(payload) {
        this._dispatcher.fireEvent(this.EVENT_NAME, payload);
    }
    fireEventAsync(payload) {
        return this._dispatcher.fireEventAsync(this.EVENT_NAME, payload);
    }
    removeAllListeners() {
        this._dispatcher.removeAllListeners();
    }
    hasListener(fn, scope) {
        return this._dispatcher.hasListener(this.EVENT_NAME, fn, scope);
    }
    listenerCount() {
        return this._dispatcher.listenerCount(this.EVENT_NAME);
    }
}
exports.Event = Event;
//# sourceMappingURL=event.js.map