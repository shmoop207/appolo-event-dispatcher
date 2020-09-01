"use strict";
import chai = require('chai');
import {EventDispatcher, Event} from '../index';

let should = chai.should();

function delay(time) {
    return new Promise((resolve,) => {
        setTimeout(resolve, time)
    })
}

describe("event dispatcher", function () {

    class EventHandler {

        dispatcher: EventDispatcher;

        constructor(dispatcher) {
            this.dispatcher = dispatcher;
        }

        handle() {
            this.dispatcher.un('topic', this.handle, this)
        }
    }

    it('can un-subscribe from event while handling the event itself', function () {
        let dispatcher = new EventDispatcher();

        let handler1 = new EventHandler(dispatcher);
        let handler2 = new EventHandler(dispatcher);

        dispatcher.on('topic', handler1.handle, handler1);
        dispatcher.on('topic', handler2.handle, handler2);

        (function () {
            dispatcher.fireEvent('topic')
        }).should.not.throw();

        // dispatcher.fireEvent('topic').should.not.throw();
    });

    it("should fire event with params", async () => {
        let value = 0;

        class EventHandler extends EventDispatcher {

        }

        let a = new EventHandler();
        a.on("test", (v) => value = v);
        a.fireEvent("test", 5);
        value.should.be.eq(5);


    });

    it("should subscribe with fire event with params", async () => {
        let value = 0;


        let a = new EventDispatcher();

        let fn = (v) => value = v;

        a.on("test", fn);

        a.un("test", fn);

        a.fireEvent("test", 5);

        value.should.be.eq(0);


    });

    it("should unsubscribe only once ", async () => {
        let value = 0;


        let a = new EventDispatcher();

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
        let eventDispatcher = new EventDispatcher();

        let args = [];

        eventDispatcher.on(["a", "b", "c"], function () {
            args = Array.from(arguments)
        }, null, {saga: true})

        setTimeout(() => eventDispatcher.fireEvent("b", 5), 1);
        setTimeout(() => eventDispatcher.fireEvent("c", 6), 4);
        setTimeout(() => eventDispatcher.fireEvent("c", 7), 1);
        setTimeout(() => eventDispatcher.fireEvent("a", 8), 3);

        await new Promise(resolve => setTimeout(resolve, 5))

        args.should.be.deep.eq([8, 5, 7])

    })

    it("should fire once saga", async () => {
        let eventDispatcher = new EventDispatcher();


        setTimeout(() => eventDispatcher.fireEvent("b", 5), 1);
        setTimeout(() => eventDispatcher.fireEvent("c", 6), 4);
        setTimeout(() => eventDispatcher.fireEvent("c", 7), 1);
        setTimeout(() => eventDispatcher.fireEvent("a", 8), 3);

        let args = await eventDispatcher.once(["a", "b", "c"], null, null, {saga: true})

        args.should.be.deep.eq([8, 5, 7])

    })

    it("should fire by order", async () => {

        let str = ""


        let a = new EventDispatcher();

        a.on("test", () => str += "1#", null, {})
        a.on("test", () => str += "2#", null, {order: 3})
        a.on("test", () => str += "3#", null, {order: 1});
        a.on("test", () => str += "4#", null, {});
        a.on("test", () => str += "5#", null, {order: 2});

        a.fireEvent("test");


        str.should.be.eq("2#5#3#1#4#")
    })

    it("should subscribe with once", async () => {
        let value = 0;


        let a = new EventDispatcher();

        let fn = (v) => value = v;
        a.once("test", fn);

        a.fireEvent("test", 5);

        value.should.be.eq(5);

        a.fireEvent("test", 6);
        value.should.be.eq(5);


    });

    it("should subscribe with once with promise", async () => {
        let value;

        let a = new EventDispatcher();

        setTimeout(() => a.fireEvent("test", 5), 1);

        value = await a.once("test");

        value.should.be.eq(5);

        a.fireEvent("test", 6);
        value.should.be.eq(5);


    });

    it("should subscribe with once with promise timeout", async () => {
        let value;

        let a = new EventDispatcher();

        setTimeout(() => a.fireEvent("test", 5), 3);
        try {
            value = await a.once("test", null, null, {timeout: 5});
            value.should.not.be.ok
        } catch (e) {
            e.should.be.instanceOf(Error);
        }

    });

    it("should removeAllListeners", async () => {
        let value = 0;


        let a = new EventDispatcher();

        let fn = ((v) => value = v);
        a.on("test", fn);

        a.removeAllListeners();
        a.fireEvent("test", 5);

        value.should.be.eq(0);

    });

    it("should removeListeners by scope ", async () => {
        let value = 0;


        let a = new EventDispatcher();

        let fn = ((v) => value = v);
        a.on("test", fn, this);

        a.removeListenersByScope(this);
        a.fireEvent("test", 5)

        value.should.be.eq(0);

    });

    it("should fire by scope ", async () => {

        class Test extends EventDispatcher {
            public num = 0;

            constructor() {
                super();
                this.on("test", this.add, this);
            }

            add(num: number) {
                this.num += num
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

        class Test extends EventDispatcher {


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

    })

    it("should have listener ", async () => {

        let value = 0;

        class Test extends EventDispatcher {


        }

        let eventDispatcher = new EventDispatcher();
        eventDispatcher.on("test", (num) => value = num);

        let test = new Test();

        test.bubble("test", eventDispatcher);

        test.fireEvent("test", 5);

        value.should.be.eq(5);

    })

    it("should fire event with Event", () => {

        let str = "";

        class Test {

            event: Event<string> = new Event();


            handle() {
                this.event.fireEvent("aaa")
            }
        }

        let test = new Test();

        test.event.on((result: string) => str = result);

        test.handle();

        str.should.be.eq("aaa");
    });

    it("should fire event with Event with saga", () => {

        let str = "";

        class Test {

            event: Event<string> = new Event();
            event2: Event<string> = new Event();


            handle() {
                this.event.fireEvent("aaa")
                this.event2.fireEvent("bbb")
            }
        }

        let test = new Test();

        Event.saga([test.event, test.event2], function () {
            str = Array.from(arguments).join(",");
        })

        test.handle();

        str.should.be.eq("aaa,bbb");
    });

    it("should fire event with Event with saga once", async () => {

        let str = "";

        class Test {

            event: Event<string> = new Event();
            event2: Event<string> = new Event();


            handle() {
                this.event.fireEvent("aaa")
                this.event2.fireEvent("bbb")
            }
        }

        let test = new Test();

        setTimeout(()=>test.handle());

        let results =  await Event.sagaOnce([test.event, test.event2]);

        results.join(",").should.be.eq("aaa,bbb");
    });


    it("should fire event with routing Key", () => {

        let str = 0;

        class Test {

            event = new EventDispatcher();


            handle() {
                this.event.fireEvent("aaa.bbb", "aaa")
            }
        }

        let test = new Test();

        let fn = (result: string) => str++;
        let fn2 = (result: string) => str++;

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

        class EventHandler extends EventDispatcher {

        }

        let a = new EventHandler();
        a.on("test", async (v) => {
            await delay(3);
            value = 1
        }, null, {parallel: true, await: true});

        a.on("test", async (v) => {
            await delay(1);
            value = 2
        }, null, {parallel: true, await: true});

        await a.fireEventAsync("test", 5);

        value.should.be.eq(1);
    });

    it("should wait for hook serial", async () => {

        let value = 0;

        class EventHandler extends EventDispatcher {

        }

        let a = new EventHandler();
        a.on("test", async (v) => {
            await delay(3);
            value = 1
        }, null, {parallel: false, await: true});

        a.on("test", async (v) => {
            await delay(1);
            value = 2
        }, null, {parallel: false, await: true});

        await a.fireEventAsync("test", 5);

        value += 10;


        value.should.be.eq(12);

    });

    it("should run with iterator limit", async () => {
        const emitter = new EventDispatcher();
        const iterator = emitter.iterator("test", {limit: 2});

        emitter.fireEvent('test', 1);
        emitter.fireEvent('test', 2);
        emitter.fireEvent('test', 3);

        let result = await iterator.next();

        result.should.be.deep.equal({value: 1, done: false});

        result = await iterator.next();
        result.should.be.deep.equal({value: 2, done: false});

        result = await iterator.next();
        result.should.be.deep.equal({value: undefined, done: true});
    });

    it("should run with iterator for of", async () => {
        const emitter = new EventDispatcher();
        const iterator = emitter.iterator("test", {limit: 3});

        emitter.fireEvent('test', 1);
        await delay(1);

        emitter.fireEvent('test', 2);
        await delay(1);
        emitter.fireEvent('test', 3);
        await delay(1);

        let results = [];

        for await (const value of iterator) {
            results.push(value)
        }

        results.should.be.deep.equal([1, 2, 3]);

    })

});
