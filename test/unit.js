"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
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
    it("should fire saga", async () => {
        let eventDispatcher = new index_1.EventDispatcher();
        let args = [];
        eventDispatcher.on(["a", "b", "c"], function () {
            args = Array.from(arguments);
        }, null, { saga: true });
        setTimeout(() => eventDispatcher.fireEvent("b", 5), 1);
        setTimeout(() => eventDispatcher.fireEvent("c", 6), 4);
        setTimeout(() => eventDispatcher.fireEvent("c", 7), 1);
        setTimeout(() => eventDispatcher.fireEvent("a", 8), 3);
        await new Promise(resolve => setTimeout(resolve, 5));
        args.should.be.deep.eq([8, 5, 7]);
    });
    it("should fire once saga", async () => {
        let eventDispatcher = new index_1.EventDispatcher();
        setTimeout(() => eventDispatcher.fireEvent("b", 5), 1);
        setTimeout(() => eventDispatcher.fireEvent("c", 6), 4);
        setTimeout(() => eventDispatcher.fireEvent("c", 7), 1);
        setTimeout(() => eventDispatcher.fireEvent("a", 8), 3);
        let args = await eventDispatcher.once(["a", "b", "c"], null, null, { saga: true });
        args.should.be.deep.eq([8, 5, 7]);
    });
    it("should fire by order", async () => {
        let str = "";
        let a = new index_1.EventDispatcher();
        a.on("test", () => str += "1#", null, {});
        a.on("test", () => str += "2#", null, { order: 3 });
        a.on("test", () => str += "3#", null, { order: 1 });
        a.on("test", () => str += "4#", null, {});
        a.on("test", () => str += "5#", null, { order: 2 });
        a.fireEvent("test");
        str.should.be.eq("2#5#3#1#4#");
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
    it("should await event callback", async () => {
        let value = 0;
        let a = new index_1.Event();
        a.once(async () => {
            await new Promise(resolve => setTimeout(resolve, 1));
            value += 2;
        }, this, { await: true });
        a.on(async () => {
            await new Promise(resolve => setTimeout(resolve, 1));
            value += 2;
        }, this, { await: true });
        a.on(async () => {
            await new Promise(resolve => setTimeout(resolve, 1));
            value += 2;
        }, this, { await: false });
        await a.fireEventAsync();
        value.should.be.eq(4);
    });
    it("should subscribe with once with promise timeout", async () => {
        let value;
        let a = new index_1.EventDispatcher();
        setTimeout(() => a.fireEvent("test", 5), 3);
        try {
            value = await a.once("test", null, null, { timeout: 5 });
            value.should.not.be.ok;
        }
        catch (e) {
            e.should.be.instanceOf(Error);
        }
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
    it("should fire event with Event with saga", () => {
        let str = "";
        class Test {
            constructor() {
                this.event = new index_1.Event();
                this.event2 = new index_1.Event();
            }
            handle() {
                this.event.fireEvent("aaa");
                this.event2.fireEvent("bbb");
            }
        }
        let test = new Test();
        index_1.Event.saga([test.event, test.event2], function () {
            str = Array.from(arguments).join(",");
        });
        test.handle();
        str.should.be.eq("aaa,bbb");
    });
    it("should fire event with Event with saga once", async () => {
        let str = "";
        class Test {
            constructor() {
                this.event = new index_1.Event();
                this.event2 = new index_1.Event();
            }
            handle() {
                this.event.fireEvent("aaa");
                this.event2.fireEvent("bbb");
            }
        }
        let test = new Test();
        setTimeout(() => test.handle());
        let results = await index_1.Event.sagaOnce([test.event, test.event2]);
        results.join(",").should.be.eq("aaa,bbb");
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
        test.event.hasListener("ccc.aaa.bbba").should.be.ok;
        test.event.listenerCount("ccc.aaa.bbba").should.be.eq(1);
    });
    it("should wait for hook parallel", async () => {
        let value = 0;
        class EventHandler extends index_1.EventDispatcher {
        }
        let a = new EventHandler();
        a.on("test", async (v) => {
            await delay(3);
            value = 1;
        }, null, { parallel: true, await: true });
        a.on("test", async (v) => {
            await delay(1);
            value = 2;
        }, null, { parallel: true, await: true });
        await a.fireEventAsync("test", 5);
        value.should.be.eq(1);
    });
    it("should wait for hook serial", async () => {
        let value = 0;
        class EventHandler extends index_1.EventDispatcher {
        }
        let a = new EventHandler();
        a.on("test", async (v) => {
            await delay(3);
            value = 1;
        }, null, { parallel: false, await: true });
        a.on("test", async (v) => {
            await delay(1);
            value = 2;
        }, null, { parallel: false, await: true });
        await a.fireEventAsync("test", 5);
        value += 10;
        value.should.be.eq(12);
    });
    it("should run with iterator limit", async () => {
        const emitter = new index_1.EventDispatcher();
        const iterator = emitter.iterator("test", { limit: 2 });
        emitter.fireEvent('test', 1);
        emitter.fireEvent('test', 2);
        emitter.fireEvent('test', 3);
        let result = await iterator.next();
        result.should.be.deep.equal({ value: 1, done: false });
        result = await iterator.next();
        result.should.be.deep.equal({ value: 2, done: false });
        result = await iterator.next();
        result.should.be.deep.equal({ value: undefined, done: true });
    });
    it("should run with iterator for of", async () => {
        var e_1, _a;
        const emitter = new index_1.EventDispatcher();
        const iterator = emitter.iterator("test", { limit: 3 });
        emitter.fireEvent('test', 1);
        await delay(1);
        emitter.fireEvent('test', 2);
        await delay(1);
        emitter.fireEvent('test', 3);
        await delay(1);
        let results = [];
        try {
            for (var iterator_1 = tslib_1.__asyncValues(iterator), iterator_1_1; iterator_1_1 = await iterator_1.next(), !iterator_1_1.done;) {
                const value = iterator_1_1.value;
                results.push(value);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (iterator_1_1 && !iterator_1_1.done && (_a = iterator_1.return)) await _a.call(iterator_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        results.should.be.deep.equal([1, 2, 3]);
    });
});
//# sourceMappingURL=unit.js.map