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
exports.UserProfileDialog = void 0;
const botbuilder_dialogs_1 = require("botbuilder-dialogs");
const userProfile_1 = require("../models/userProfile");
const extractCityFromMessage_1 = require("../utils/extractCityFromMessage");
const isAskingForCurrentWeather_1 = require("../utils/isAskingForCurrentWeather");
const isAskingForForecast_1 = require("../utils/isAskingForForecast");
const isAskingForPreparation_1 = require("../utils/isAskingForPreparation");
const isAskingToChangeCity_1 = require("../utils/isAskingToChangeCity");
const isAskingToExit_1 = require("../utils/isAskingToExit");
const userProfileService_1 = require("../services/userProfileService");
const CITY_PROMPT = 'CITY_PROMPT';
const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const WELLCOME_PROMPT = 'WELLCOME_PROMPT';
const START_PROMPT = 'START_PROMPT';
const LOOP_DIALOG = 'LOOP_DIALOG';
class UserProfileDialog extends botbuilder_dialogs_1.ComponentDialog {
    constructor(userState, weatherService) {
        super('userProfileDialog');
        this.userProfile = userState.createProperty(USER_PROFILE);
        this.userProfileService = new userProfileService_1.UserProfileService();
        this.weatherService = weatherService;
        this.addDialog(new botbuilder_dialogs_1.TextPrompt(WELLCOME_PROMPT));
        this.addDialog(new botbuilder_dialogs_1.TextPrompt(CITY_PROMPT));
        this.addDialog(new botbuilder_dialogs_1.TextPrompt(START_PROMPT));
        this.addDialog(new botbuilder_dialogs_1.WaterfallDialog(WATERFALL_DIALOG, [
            this.wellcome.bind(this),
            this.confirmCity.bind(this),
            this.changeDialog.bind(this),
        ]));
        this.addDialog(new botbuilder_dialogs_1.WaterfallDialog(LOOP_DIALOG, [
            this.startLoop.bind(this),
            this.mainLoop.bind(this)
        ]));
        this.initialDialogId = WATERFALL_DIALOG;
    }
    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    run(turnContext, accessor) {
        return __awaiter(this, void 0, void 0, function* () {
            const dialogSet = new botbuilder_dialogs_1.DialogSet(accessor);
            dialogSet.add(this);
            const dialogContext = yield dialogSet.createContext(turnContext);
            const results = yield dialogContext.continueDialog();
            if (results.status === botbuilder_dialogs_1.DialogTurnStatus.empty) {
                yield dialogContext.beginDialog(this.id);
            }
        });
    }
    wellcome(stepContext) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield stepContext.prompt(WELLCOME_PROMPT, "Welcome to the Weather Bot! \n \n please tell me the city you want to see the weather");
        });
    }
    confirmCity(stepContext) {
        return __awaiter(this, void 0, void 0, function* () {
            const cityName = (0, extractCityFromMessage_1.extractCityFromMessage)(stepContext.result);
            try {
                const geocoding = yield this.weatherService.getGeocoding(cityName);
                console.log('City name extracted:', cityName);
                console.log('Geocoding result:', geocoding);
                const userProfile = yield this.userProfile.get(stepContext.context, new userProfile_1.UserProfile());
                userProfile.id = stepContext.context.activity.from.id;
                userProfile.cityName = geocoding.name;
                userProfile.citylat = geocoding.lat;
                userProfile.citylon = geocoding.lon;
                yield this.userProfile.set(stepContext.context, userProfile);
                yield stepContext.context.sendActivity(`You have entered the city: ${geocoding.name}, ${geocoding.country}`);
                return stepContext.next();
            }
            catch (error) {
                console.error('Error fetching geocoding data:', error);
                console.log(stepContext.context.sendActivity(` City "${cityName}" not found. Please enter a valid city name.`));
                yield stepContext.context.sendActivity(` City "${cityName}" not found. Please enter a valid city name.`);
                return yield stepContext.replaceDialog(WATERFALL_DIALOG);
            }
        });
    }
    changeDialog(stepContext) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield stepContext.replaceDialog(LOOP_DIALOG);
        });
    }
    startLoop(stepContext) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield stepContext.prompt(START_PROMPT, 'What weather information would you like to know? Please enter one of the following keywords:\n' +
                '\n• "current" - view current weather\n' +
                '\n• "forecast" - view weather forecast\n' +
                '\n• "prepare" - know what to bring\n' +
                '\n• "change city" - change to another city\n' +
                '\n• "exit" - exit the bot');
        });
    }
    mainLoop(stepContext) {
        return __awaiter(this, void 0, void 0, function* () {
            const userProfile = yield this.userProfile.get(stepContext.context, new userProfile_1.UserProfile());
            if (!stepContext.result || typeof stepContext.result !== 'string') {
                yield stepContext.context.sendActivity(` I didn't receive your message. Please try again with:\n` +
                    `\n• "current" - current weather\n` +
                    `\n• "forecast" - weather forecast\n` +
                    `\n• "prepare" - what to bring\n` +
                    `\n• "change city" - change location\n` +
                    `\n• "exit" - exit the bot`);
                return yield stepContext.replaceDialog(LOOP_DIALOG);
            }
            const userInput = stepContext.result;
            if ((0, isAskingForCurrentWeather_1.isAskingForCurrentWeather)(userInput)) {
                try {
                    const weather = yield this.weatherService.getWeatherNow(userProfile.citylat, userProfile.citylon);
                    userProfile.getUpdate = true;
                    yield this.userProfileService.createOrUpdateUserProfile(userProfile);
                    yield stepContext.context.sendActivity(`\n **Current weather in ${userProfile.cityName}:**\n` +
                        `\n• Temperature: ${Math.round(weather.temperature)}°C\n` +
                        `\n• Humidity: ${weather.humidity}%\n` +
                        `\n• Condition: ${weather.description}\n` +
                        `\n• Wind speed: ${weather.windSpeed} m/s`);
                }
                catch (error) {
                    yield stepContext.context.sendActivity(` Unable to get weather information for ${userProfile.cityName}. Please try again.`);
                }
                return yield stepContext.replaceDialog(LOOP_DIALOG);
            }
            else if ((0, isAskingForForecast_1.isAskingForForecast)(userInput)) {
                try {
                    const forecast = yield this.weatherService.getWeatherForecast(userProfile.citylat, userProfile.citylon);
                    let forecastMessage = ` **Weather forecast for ${userProfile.cityName}:**\n`;
                    forecast.forEach((day, index) => {
                        const dayLabel = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : 'Day after tomorrow';
                        forecastMessage += `\n• ${dayLabel}: ${day.description} (${day.minTemp}°C - ${day.maxTemp}°C)\n`;
                    });
                    yield stepContext.context.sendActivity(forecastMessage);
                }
                catch (error) {
                    yield stepContext.context.sendActivity(` Unable to get weather forecast for ${userProfile.cityName}. Please try again.`);
                }
                return yield stepContext.replaceDialog(LOOP_DIALOG);
            }
            else if ((0, isAskingForPreparation_1.isAskingForPreparation)(userInput)) {
                try {
                    const preparation = yield this.weatherService.getWeatherPreparationAdvice(userProfile.citylat, userProfile.citylon);
                    let adviceMessage = `**Based on the weather in ${userProfile.cityName}, you should prepare:**\n`;
                    preparation.advice.forEach((item) => {
                        adviceMessage += `\n• ${item}\n`;
                    });
                    yield stepContext.context.sendActivity(adviceMessage);
                }
                catch (error) {
                    yield stepContext.context.sendActivity(`Unable to get preparation advice for ${userProfile.cityName}. Please try again.`);
                }
                return yield stepContext.replaceDialog(LOOP_DIALOG);
            }
            else if ((0, isAskingToChangeCity_1.isAskingToChangeCity)(userInput)) {
                yield stepContext.context.sendActivity(' You want to change to another city. Let\'s start over!');
                return yield stepContext.replaceDialog(WATERFALL_DIALOG);
            }
            else if ((0, isAskingToExit_1.isAskingToExit)(userInput)) {
                yield stepContext.context.sendActivity(' Thank you for using Weather Bot! Have a great day!');
                return yield stepContext.endDialog();
            }
            else {
                yield stepContext.context.sendActivity(` I don't understand "${stepContext.result}". Please try again with:\n` +
                    `\n• "current" - current weather\n` +
                    `\n• "forecast" - weather forecast\n` +
                    `\n• "prepare" - what to bring\n` +
                    `\n• "change city" - change location\n` +
                    `\n• "exit" - exit the bot`);
                // Tiếp tục vòng lặp
                return yield stepContext.replaceDialog(LOOP_DIALOG);
            }
        });
    }
}
exports.UserProfileDialog = UserProfileDialog;
//# sourceMappingURL=userProfileDialog.js.map