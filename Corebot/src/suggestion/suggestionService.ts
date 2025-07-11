import { Suggestion } from "./suggestion"

export class SuggestionService {

    constructor() {
    }
 
    setSuggestion(suggestionId: string, suggestionText: string ,suggestion : Suggestion): void {
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

