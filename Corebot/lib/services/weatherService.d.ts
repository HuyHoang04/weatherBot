export interface GeocodingResponse {
    lat: number;
    lon: number;
    name: string;
    country: string;
}
export declare class WeatherService {
    private apiKey;
    constructor();
    getGeocoding(city: string): Promise<GeocodingResponse>;
    getWeatherNow(lat: number, lon: number): Promise<any>;
    getWeatherForecast(lat: number, lon: number): Promise<any>;
    getWeatherPreparationAdvice(lat: number, lon: number): Promise<any>;
}
