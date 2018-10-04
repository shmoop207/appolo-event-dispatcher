import {CallbacksSymbol, EventDispatcher} from "./eventDispatcher";
import {IEventHook} from "./IEventOptions";
import {Util} from "./util";

export class HooksDispatcher extends EventDispatcher {

    public once(event: string, fn?: (...args: any[]) => any, scope?: any, options: IEventHook = {}): Promise<any> | void {
        super.once(event, fn, scope, options);
    }

    public on(event: string, fn: (...args: any[]) => any, scope?: any, options?: IEventHook): void {
        super.on(event, fn, scope, options);
    }

    public async fireEvent(event: string, ...args: any[]): Promise<void> {

        if (!this[CallbacksSymbol]) {
            return;
        }

        let callbacks = this[CallbacksSymbol][event];

        if (!callbacks) {
            return;
        }

        let promises = [];

        for (let i = callbacks.length - 1; i >= 0; i--) {
            let callback = callbacks[i];

            if (!callback || !callback.fn) {
                continue;
            }

            let result = callback.fn.apply((callback.scope || null), args);

            if (Util.isPromise(result)) {

                if ((callback.options  as IEventHook).parallel) {
                    promises.push(result)
                } else {
                    await result
                }
            }

            if (callback.options.once) {
                callbacks.splice(i, 1);
            }
        }

        if (promises.length) {
            await Promise.all(promises);
        }

    }

}