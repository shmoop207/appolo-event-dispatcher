"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Util {
    static isPromise(obj) {
        return obj && obj.then && obj.catch;
    }
}
exports.Util = Util;
//# sourceMappingURL=util.js.map