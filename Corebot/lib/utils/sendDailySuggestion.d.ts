import { UserProfileService } from "../services/userProfileService";
import { WeatherService } from "../services/weatherService";
import { CloudAdapter } from "botbuilder";
export declare function sendDailySuggestion(weatherService: WeatherService, userProfileService: UserProfileService, adapter: CloudAdapter, conversationReferences: any): Promise<void>;
