"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const eventDispatcher_1 = require("../lib/eventDispatcher");
let should = chai.should();
describe("event dispatcher", function () {
    class EventHandler {
        constructor(dispatcher) {
            this.dispatcher = dispatcher;
        }
        handle() {
            this.dispatcher.un('topic', this.handle, this);
        }
    }
    it('can un-subscribe from event while handling the event itself', function () {
        let dispatcher = new eventDispatcher_1.EventDispatcher();
        let handler1 = new EventHandler(dispatcher);
        let handler2 = new EventHandler(dispatcher);
        dispatcher.on('topic', handler1.handle, handler1);
        dispatcher.on('topic', handler2.handle, handler2);
        (function () {
            dispatcher.fireEvent('topic');
        }).should.not.throw();
        // dispatcher.fireEvent('topic').should.not.throw();
    });
    it("should fire event with params", async () => {
        let value = 0;
        class EventHandler extends eventDispatcher_1.EventDispatcher {
        }
        let a = new EventHandler();
        a.on("test", (v) => value = v);
        a.fireEvent("test", 5);
        value.should.be.eq(5);
    });
    it("should subscribe with fire event with params", async () => {
        let value = 0;
        let a = new eventDispatcher_1.EventDispatcher();
        let fn = (v) => value = v;
        a.on("test", fn);
        a.un("test", fn);
        a.fireEvent("test", 5);
        value.should.be.eq(0);
    });
    it("should subscribe with once", async () => {
        let value = 0;
        let a = new eventDispatcher_1.EventDispatcher();
        let fn = (v) => value = v;
        a.once("test", fn);
        a.fireEvent("test", 5);
        value.should.be.eq(5);
        a.fireEvent("test", 6);
        value.should.be.eq(5);
    });
    it("should subscribe with once with promise", async () => {
        let value;
        let a = new eventDispatcher_1.EventDispatcher();
        setTimeout(() => a.fireEvent("test", 5), 1);
        value = await a.once("test");
        value.should.be.eq(5);
        a.fireEvent("test", 6);
        value.should.be.eq(5);
    });
    it("should removeAllListeners", async () => {
        let value = 0;
        let a = new eventDispatcher_1.EventDispatcher();
        let fn = ((v) => value = v);
        a.on("test", fn);
        a.removeAllListeners();
        a.fireEvent("test", 5);
        value.should.be.eq(0);
    });
    it("should removeListeners by scope ", async () => {
        let value = 0;
        let a = new eventDispatcher_1.EventDispatcher();
        let fn = ((v) => value = v);
        a.on("test", fn, this);
        a.removeListenersByScope(this);
        a.fireEvent("test", 5);
        value.should.be.eq(0);
    });
});
//# sourceMappingURL=unit.js.map