"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionService = void 0;
class SuggestionService {
    constructor() {
    }
    setSuggestion(suggestionId, suggestionText, suggestion) {
        switch (suggestionId) {
            case '35':
                suggestion.maxTempGreaterThan35 = suggestionText;
                break;
            case '30':
                suggestion.maxTempGreaterThan30 = suggestionText;
                break;
            case '25':
                suggestion.maxTempGreaterThan25 = suggestionText;
                break;
            case '20':
                suggestion.maxTempGreaterThan20 = suggestionText;
                break;
            default:
                throw new Error('Invalid suggestion ID');
        }
    }
}
exports.SuggestionService = SuggestionService;
//# sourceMappingURL=suggestionService.js.map