// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { StatePropertyAccessor, TurnContext, UserState } from 'botbuilder';
import {
    ComponentDialog,
    DialogSet,
    DialogTurnStatus,
    TextPrompt,
    WaterfallDialog,
    WaterfallStepContext
} from 'botbuilder-dialogs';
import { UserProfile } from '../models/userProfile';
import { extractCityFromMessage } from '../utils/extractCityFromMessage';
import { isAskingForCurrentWeather } from '../utils/isAskingForCurrentWeather';
import { isAskingForForecast } from '../utils/isAskingForForecast';
import { isAskingForPreparation } from '../utils/isAskingForPreparation';
import { isAskingToChangeCity } from '../utils/isAskingToChangeCity';
import { isAskingToExit } from '../utils/isAskingToExit';
import { WeatherService } from '../services/weatherService';
import { UserProfileService } from '../services/userProfileService';

const CITY_PROMPT = 'CITY_PROMPT';
const USER_PROFILE = 'USER_PROFILE';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const WELLCOME_PROMPT = 'WELLCOME_PROMPT';
const START_PROMPT = 'START_PROMPT';
const LOOP_DIALOG = 'LOOP_DIALOG';

export class UserProfileDialog extends ComponentDialog {
    private userProfile: StatePropertyAccessor<UserProfile>;
    private weatherService: WeatherService;
    private userProfileService: UserProfileService;

    constructor(userState: UserState, weatherService: WeatherService) {
        super('userProfileDialog');

        this.userProfile = userState.createProperty(USER_PROFILE);
        this.userProfileService = new UserProfileService();
        
        this.weatherService = weatherService;
        this.addDialog(new TextPrompt(WELLCOME_PROMPT));
        this.addDialog(new TextPrompt(CITY_PROMPT));
        this.addDialog(new TextPrompt(START_PROMPT));

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.wellcome.bind(this),
            this.confirmCity.bind(this),
            this.changeDialog.bind(this),
        ]));

        this.addDialog(new WaterfallDialog(LOOP_DIALOG, [
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
    public async run(turnContext: TurnContext, accessor: StatePropertyAccessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    private async wellcome (stepContext: WaterfallStepContext<UserProfile>) {
        return await stepContext.prompt(WELLCOME_PROMPT, "Welcome to the Weather Bot! \n \n please tell me the city you want to see the weather");
    }

    private async confirmCity(stepContext: WaterfallStepContext<UserProfile>) {
        const cityName = extractCityFromMessage(stepContext.result as string);

        try {

            const geocoding = await this.weatherService.getGeocoding(cityName);
            console.log('City name extracted:', cityName);
            console.log('Geocoding result:', geocoding);
            const userProfile = await this.userProfile.get(stepContext.context, new UserProfile());
            userProfile.id = stepContext.context.activity.from.id;
            userProfile.cityName = geocoding.name;
            userProfile.citylat = geocoding.lat;
            userProfile.citylon = geocoding.lon;
            await this.userProfile.set(stepContext.context, userProfile);

            await stepContext.context.sendActivity(`You have entered the city: ${geocoding.name}, ${geocoding.country}`);

            return stepContext.next();
        } catch (error) {
            console.error('Error fetching geocoding data:', error);
            console.log(stepContext.context.sendActivity(
                ` City "${cityName}" not found. Please enter a valid city name.`
            ));
            await stepContext.context.sendActivity(
                ` City "${cityName}" not found. Please enter a valid city name.`
            );

            return await stepContext.replaceDialog(WATERFALL_DIALOG);
        }
    }
    private async changeDialog(stepContext: WaterfallStepContext<UserProfile>) {

        return await stepContext.replaceDialog(LOOP_DIALOG);
    }

    private async startLoop(stepContext: WaterfallStepContext<UserProfile>) {

        return await stepContext.prompt(START_PROMPT,  'What weather information would you like to know? Please enter one of the following keywords:\n' +
            '\n• "current" - view current weather\n' +
            '\n• "forecast" - view weather forecast\n' +
            '\n• "prepare" - know what to bring\n' +
            '\n• "change city" - change to another city\n' +
            '\n• "exit" - exit the bot')
    }

    private async mainLoop(stepContext: WaterfallStepContext<UserProfile>) {
        const userProfile = await this.userProfile.get(stepContext.context, new UserProfile());
        
        if (!stepContext.result || typeof stepContext.result !== 'string') {
            await stepContext.context.sendActivity(
                ` I didn't receive your message. Please try again with:\n` +
                `\n• "current" - current weather\n` +
                `\n• "forecast" - weather forecast\n` +
                `\n• "prepare" - what to bring\n` +
                `\n• "change city" - change location\n` +
                `\n• "exit" - exit the bot`
            );
            return await stepContext.replaceDialog(LOOP_DIALOG);
        }
        
        const userInput = stepContext.result as string;
        

        if (isAskingForCurrentWeather(userInput)) {
            try {

                const weather = await this.weatherService.getWeatherNow(userProfile.citylat, userProfile.citylon);

                userProfile.getUpdate = true; 
                await this.userProfileService.createOrUpdateUserProfile(userProfile);
            
                
                await stepContext.context.sendActivity(
                    `\n **Current weather in ${userProfile.cityName}:**\n` +
                    `\n• Temperature: ${Math.round(weather.temperature)}°C\n` +
                    `\n• Humidity: ${weather.humidity}%\n` +
                    `\n• Condition: ${weather.description}\n` +
                    `\n• Wind speed: ${weather.windSpeed} m/s`
                );
            } catch (error) {
                await stepContext.context.sendActivity(
                    ` Unable to get weather information for ${userProfile.cityName}. Please try again.`
                );
            }
            return await stepContext.replaceDialog(LOOP_DIALOG);
            
        } else if (isAskingForForecast(userInput)) {
            try {

                const forecast = await this.weatherService.getWeatherForecast(userProfile.citylat, userProfile.citylon);
                
                let forecastMessage = ` **Weather forecast for ${userProfile.cityName}:**\n`;
                forecast.forEach((day: any, index: number) => {
                    const dayLabel = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : 'Day after tomorrow';
                    forecastMessage += `\n• ${dayLabel}: ${day.description} (${day.minTemp}°C - ${day.maxTemp}°C)\n`;
                });
                
                await stepContext.context.sendActivity(forecastMessage);
            } catch (error) {
                await stepContext.context.sendActivity(
                    ` Unable to get weather forecast for ${userProfile.cityName}. Please try again.`
                );
            }
            return await stepContext.replaceDialog(LOOP_DIALOG);
            
        } else if (isAskingForPreparation(userInput)) {
            try {
                const preparation = await this.weatherService.getWeatherPreparationAdvice(userProfile.citylat, userProfile.citylon);
                
                let adviceMessage = `**Based on the weather in ${userProfile.cityName}, you should prepare:**\n`;
                preparation.advice.forEach((item: string) => {
                    adviceMessage += `\n• ${item}\n`;
                });
                
                await stepContext.context.sendActivity(adviceMessage);
            } catch (error) {
                await stepContext.context.sendActivity(
                    `Unable to get preparation advice for ${userProfile.cityName}. Please try again.`
                );
            }
            return await stepContext.replaceDialog(LOOP_DIALOG);
            
        } else if (isAskingToChangeCity(userInput)) {
            await stepContext.context.sendActivity(' You want to change to another city. Let\'s start over!');
            return await stepContext.replaceDialog(WATERFALL_DIALOG);
            
        } else if (isAskingToExit(userInput)) {
            await stepContext.context.sendActivity(' Thank you for using Weather Bot! Have a great day!');
            return await stepContext.endDialog();
            
        } else {
            await stepContext.context.sendActivity(
                ` I don't understand "${stepContext.result}". Please try again with:\n` +
                `\n• "current" - current weather\n` +
                `\n• "forecast" - weather forecast\n` +
                `\n• "prepare" - what to bring\n` +
                `\n• "change city" - change location\n` +
                `\n• "exit" - exit the bot`
            );
            // Tiếp tục vòng lặp
            return await stepContext.replaceDialog(LOOP_DIALOG);
        }
    }
}
