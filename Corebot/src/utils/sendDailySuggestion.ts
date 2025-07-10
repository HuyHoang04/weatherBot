import { UserProfileService } from "../userProfile/userProfileService";
import { WeatherService } from "../weather/weatherService";
import { CloudAdapter } from "botbuilder";

export async function sendDailySuggestion(
    weatherService: WeatherService, 
    userProfileService: UserProfileService,
    adapter: CloudAdapter,
    conversationReferences: any
): Promise<void> {
    try {
        console.log(`Starting daily suggestion job`);
        
        const users = await userProfileService.getUsersWithUpdates();
        let sentCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            let conversationReference = null;
            
            for (const [key, ref] of Object.entries(conversationReferences)) {
                const convRef = ref as any;
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

                const weather = await weatherService.getWeatherNow(user.citylat, user.citylon);
                const weatherSuggestion = await weatherService.getWeatherPreparationAdvice(user.citylat, user.citylon);
                
                let adviceMessage = ``;
                weatherSuggestion.advice.forEach((item: string) => {
                    adviceMessage += `\n• ${item}\n`;
                });
                
                const message = `**Recurring Message - Good Morning!**\n\n` +
                               `\nWeather at ${user.cityName}:\n` +
                               `\nTemperature: ${Math.round(weather.temperature)}°C\n` +
                               `\nDescription: ${weather.description || 'N/A'}\n` +
                               `\nBased on the weather you should prepare:\n`+ `${adviceMessage}`;
                
                await adapter.continueConversationAsync(
                    process.env.MicrosoftAppId,
                    conversationReference,
                    async (context) => {
                        await context.sendActivity(message);
                    }
                );
                
                console.log(`Message sent successfully to user ${user.id}`);
                sentCount++;
                    
            } catch (error) {
                console.error(`Error sending message to user ${user.id}:`, error.message);
                skippedCount++;
            }
        }
        
        console.log(`${sentCount} sent, ${skippedCount} skipped`);
             
    } catch (error) {
        console.error('Error in sendDailySuggestion:', error);
        throw error;
    }
}