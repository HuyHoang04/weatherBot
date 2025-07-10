import { UserProfileService } from "../userProfile/userProfileService";
import { WeatherService } from "../weather/weatherService";
import { CloudAdapter } from "botbuilder";
export declare function sendDailySuggestion(weatherService: WeatherService, userProfileService: UserProfileService, adapter: CloudAdapter, conversationReferences: any): Promise<void>;
