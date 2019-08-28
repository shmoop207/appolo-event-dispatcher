"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const index_1 = require("../index");
let should = chai.should();
function delay(time) {
    return new Promise((resolve) => {
        setTimeout(resolve, time);
    });
}
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
        let dispatcher = new index_1.EventDispatcher();
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
        class EventHandler extends index_1.EventDispatcher {
        }
        let a = new EventHandler();
        a.on("test", (v) => value = v);
        a.fireEvent("test", 5);
        value.should.be.eq(5);
    });
    it("should subscribe with fire event with params", async () => {
        let value = 0;
        let a = new index_1.EventDispatcher();
        let fn = (v) => value = v;
        a.on("test", fn);
        a.un("test", fn);
        a.fireEvent("test", 5);
        value.should.be.eq(0);
    });
    it("should unsubscribe only once ", async () => {
        let value = 0;
        let a = new index_1.EventDispatcher();
        let fn = (v) => value += v;
        let fn2 = (v) => value += v;
        let fn3 = (v) => value += v;
        a.on("test", fn, this);
        a.on("test", fn2);
        a.on("test", fn3, this);
        a.fireEvent("test", 5);
        a.un("test", fn);
        a.un("test", fn3, this);
        a.fireEvent("test", 5);
        value.should.be.eq(20);
    });
    it("should subscribe with once", async () => {
        let value = 0;
        let a = new index_1.EventDispatcher();
        let fn = (v) => value = v;
        a.once("test", fn);
        a.fireEvent("test", 5);
        value.should.be.eq(5);
        a.fireEvent("test", 6);
        value.should.be.eq(5);
    });
    it("should subscribe with once with promise", async () => {
        let value;
        let a = new index_1.EventDispatcher();
        setTimeout(() => a.fireEvent("test", 5), 1);
        value = await a.once("test");
        value.should.be.eq(5);
        a.fireEvent("test", 6);
        value.should.be.eq(5);
    });
    it("should removeAllListeners", async () => {
        let value = 0;
        let a = new index_1.EventDispatcher();
        let fn = ((v) => value = v);
        a.on("test", fn);
        a.removeAllListeners();
        a.fireEvent("test", 5);
        value.should.be.eq(0);
    });
    it("should removeListeners by scope ", async () => {
        let value = 0;
        let a = new index_1.EventDispatcher();
        let fn = ((v) => value = v);
        a.on("test", fn, this);
        a.removeListenersByScope(this);
        a.fireEvent("test", 5);
        value.should.be.eq(0);
    });
    it("should fire by scope ", async () => {
        class Test extends index_1.EventDispatcher {
            constructor() {
                super();
                this.num = 0;
                this.on("test", this.add, this);
            }
            add(num) {
                this.num += num;
            }
        }
        let test = new Test();
        test.fireEvent("test", 5);
        test.num.should.be.eq(5);
        test.un("test", test.add);
        test.fireEvent("test", 5);
        test.num.should.be.eq(5);
    });
    it("should bubble event ", async () => {
        let value = 0;
        class Test extends index_1.EventDispatcher {
        }
        let fn = (num) => value = num;
        let test = new Test();
        test.on("test", fn);
        test.on("test2", fn, this);
        test.hasListener("test").should.be.ok;
        test.hasListener("test", fn).should.be.ok;
        test.hasListener("test", () => ({})).should.not.be.ok;
        test.hasListener("test2", fn).should.be.ok;
        test.hasListener("test2").should.be.ok;
        test.hasListener("test2", fn, this).should.be.ok;
        test.hasListener("test2", fn, {}).should.not.be.ok;
        test.hasListener("test2", () => ({}), this).should.not.be.ok;
    });
    it("should have listener ", async () => {
        let value = 0;
        class Test extends index_1.EventDispatcher {
        }
        let eventDispatcher = new index_1.EventDispatcher();
        eventDispatcher.on("test", (num) => value = num);
        let test = new Test();
        test.bubble("test", eventDispatcher);
        test.fireEvent("test", 5);
        value.should.be.eq(5);
    });
    it("should fire event with Event", () => {
        let str = "";
        class Test {
            constructor() {
                this.event = new index_1.Event();
            }
            handle() {
                this.event.fireEvent("aaa");
            }
        }
        let test = new Test();
        test.event.on((result) => str = result);
        test.handle();
        str.should.be.eq("aaa");
    });
    it("should fire event with routing Key", () => {
        let str = 0;
        class Test {
            constructor() {
                this.event = new index_1.EventDispatcher();
            }
            handle() {
                this.event.fireEvent("aaa.bbb", "aaa");
            }
        }
        let test = new Test();
        let fn = (result) => str++;
        let fn2 = (result) => str++;
        test.event.on("#.bbb", fn);
        test.event.on("#", fn);
        test.event.on("aaa.*", fn, this);
        test.event.on("*", fn);
        test.handle();
        test.handle();
        str.should.be.eq(6);
        test.event.un("aaa.*", fn, this);
        test.handle();
        str.should.be.eq(8);
        test.event.once("#", fn2);
        test.event.fireEvent("ccc.aaa.bbba");
        str.should.be.eq(10);
        test.event.fireEvent("ccc.aaa.bbba");
        str.should.be.eq(11);
    });
});
//# sourceMappingURL=unit.js.map