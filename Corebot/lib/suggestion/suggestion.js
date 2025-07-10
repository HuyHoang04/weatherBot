"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Suggestion = void 0;
class Suggestion {
    constructor() {
        this.maxTempGreaterThan20 = "";
        this.maxTempGreaterThan25 = "";
        this.maxTempGreaterThan30 = "";
        this.maxTempGreaterThan35 = "";
    }
    setMaxTempGreaterThan35(suggestion) {
        this.maxTempGreaterThan35 = suggestion;
    }
    setMaxTempGreaterThan30(suggestion) {
        this.maxTempGreaterThan30 = suggestion;
    }
    setMaxTempGreaterThan25(suggestion) {
        this.maxTempGreaterThan25 = suggestion;
    }
    setMaxTempGreaterThan20(suggestion) {
        this.maxTempGreaterThan20 = suggestion;
    }
    getMaxTempGreaterThan35() {
        return this.maxTempGreaterThan35;
    }
    getMaxTempGreaterThan30() {
        return this.maxTempGreaterThan30;
    }
    getMaxTempGreaterThan25() {
        return this.maxTempGreaterThan25;
    }
    getMaxTempGreaterThan20() {
        return this.maxTempGreaterThan20;
    }
}
exports.Suggestion = Suggestion;
//# sourceMappingURL=suggestion.js.map