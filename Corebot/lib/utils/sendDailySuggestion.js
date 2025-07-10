"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDailySuggestion = void 0;
function sendDailySuggestion(weatherService, userProfileService, adapter, conversationReferences) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(`Starting daily suggestion job`);
            const users = yield userProfileService.getUsersWithUpdates();
            let sentCount = 0;
            let skippedCount = 0;
            for (const user of users) {
                let conversationReference = null;
                for (const [key, ref] of Object.entries(conversationReferences)) {
                    const convRef = ref;
                    if (convRef && convRef.user && convRef.user.id === user.id) {
                        conversationReference = convRef;
                        console.log(`Found conversation reference for user ${user.id} with key: ${key}`);
                        break;
                    }
                }
                if (!conversationReference || Object.keys(conversationReference).length === 0) {
                    console.log(`No conversation reference found for user ${user.id}`);
                    skippedCount++;
                    continue;
                }
                try {
                    const weather = yield weatherService.getWeatherNow(user.citylat, user.citylon);
                    const weatherSuggestion = yield weatherService.getWeatherPreparationAdvice(user.citylat, user.citylon);
                    let adviceMessage = ``;
                    weatherSuggestion.advice.forEach((item) => {
                        adviceMessage += `\n• ${item}\n`;
                    });
                    const message = `**Recurring Message - Good Morning!**\n\n` +
                        `\nWeather at ${user.cityName}:\n` +
                        `\nTemperature: ${Math.round(weather.temperature)}°C\n` +
                        `\nDescription: ${weather.description || 'N/A'}\n` +
                        `\nBased on the weather you should prepare:\n` + `${adviceMessage}`;
                    yield adapter.continueConversationAsync(process.env.MicrosoftAppId, conversationReference, (context) => __awaiter(this, void 0, void 0, function* () {
                        yield context.sendActivity(message);
                    }));
                    console.log(`Message sent successfully to user ${user.id}`);
                    sentCount++;
                }
                catch (error) {
                    console.error(`Error sending message to user ${user.id}:`, error.message);
                    skippedCount++;
                }
            }
            console.log(`${sentCount} sent, ${skippedCount} skipped`);
        }
        catch (error) {
            console.error('Error in sendDailySuggestion:', error);
            throw error;
        }
    });
}
exports.sendDailySuggestion = sendDailySuggestion;
//# sourceMappingURL=sendDailySuggestion.js.map