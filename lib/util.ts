"use strict";
export class Util {
    public static isPromise(obj: any): boolean {
        return obj && obj.then && obj.catch;

    }
}