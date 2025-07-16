

import { SuggestionService } from '../suggestion/suggestionService';

export interface GeocodingResponse {
    lat: number;
    lon: number;
    name: string;
    country: string;
}

export class WeatherService {
    private apiKey=  process.env.OPENWEATHER_API_KEY;
    private suggestionService: SuggestionService;
    
    constructor() {
        this.suggestionService = new SuggestionService();
    }
    async getGeocoding(city: string): Promise<GeocodingResponse> {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!data || !data.coord) {
                throw new Error('Invalid response from weather API');
            }
            const geocodingResponse: GeocodingResponse = {
                lat: data.coord.lat,
                lon: data.coord.lon,
                name: data.name,
                country: data.sys.country
            };
            return geocodingResponse;
        } catch (error) {
            console.error('Error fetching geocoding data:', error);
            throw new Error('Could not retrieve geocoding data.');
        }
    }
    async getWeatherNow(lat: number, lon: number): Promise<any> {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data || !data.weather) {
            throw new Error('Invalid response from weather API');
        }
        return {
            temperature: data.main.temp,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed
        };
    }
    async getWeatherForecast(lat: number, lon: number): Promise<any> {
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!data || !data.list) {
                throw new Error('Invalid response from forecast API');
            }
            
            // Xử lý dữ liệu forecast 5 ngày với interval 3 giờ
            // Nhóm theo ngày và lấy dữ liệu đại diện cho mỗi ngày
            const dailyForecast = [];
            const processedDates = new Set();
            
            for (const item of data.list) {
                const date = new Date(item.dt * 1000);
                const dateStr = date.toLocaleDateString('vi-VN');
                
                // Chỉ lấy 3 ngày đầu tiên và chỉ 1 lần mỗi ngày
                if (dailyForecast.length >= 3 || processedDates.has(dateStr)) {
                    continue;
                }
                
                // Lấy dữ liệu vào khoảng 12:00 (hoặc gần nhất) để đại diện cho ngày
                const hour = date.getHours();
                if (hour >= 11 && hour <= 13) {
                    processedDates.add(dateStr);
                    dailyForecast.push({
                        date: dateStr,
                        temperature: Math.round(item.main.temp),
                        minTemp: Math.round(item.main.temp_min),
                        maxTemp: Math.round(item.main.temp_max),
                        description: item.weather[0].description,
                        icon: item.weather[0].icon,
                        humidity: item.main.humidity
                    });
                }
            }
            
            // Nếu không đủ 3 ngày 
            if (dailyForecast.length < 3) {
                dailyForecast.length = 0;
                processedDates.clear();
                
                for (const item of data.list) {
                    const date = new Date(item.dt * 1000);
                    const dateStr = date.toLocaleDateString('vi-VN');
                    
                    if (dailyForecast.length >= 3 || processedDates.has(dateStr)) {
                        continue;
                    }
                    
                    processedDates.add(dateStr);
                    dailyForecast.push({
                        date: dateStr,
                        temperature: Math.round(item.main.temp),
                        minTemp: Math.round(item.main.temp_min),
                        maxTemp: Math.round(item.main.temp_max),
                        description: item.weather[0].description,
                        icon: item.weather[0].icon,
                        humidity: item.main.humidity
                    });
                }
            }
            
            return dailyForecast;
        } catch (error) {
            console.error('Error fetching forecast data:', error);
            throw new Error('Could not retrieve forecast data.');
        }
    }    async getWeatherPreparationAdvice(lat: number, lon: number): Promise<any> {
        try {
            const currentWeather = await this.getWeatherNow(lat, lon);
            const forecast = await this.getWeatherForecast(lat, lon);
            
            const advice = [];
            const temperature = currentWeather.temperature;
            
            const todayForecast = forecast[0];
            const maxTemp = todayForecast ? todayForecast.maxTemp : temperature;

            const allSuggestions = await this.suggestionService.getAll();

            if (Array.isArray(allSuggestions)) {
                for (const suggestion of allSuggestions) {
   
                    if (maxTemp > suggestion.temperature) {
                        if (suggestion.items && suggestion.items.length > 0) {
                            advice.push(...suggestion.items);
                        }
                        break;
                    }
                }
            }

            if (advice.length === 0) {
                if (maxTemp <= 20) {
                    advice.push('Warm clothing', 'Gloves', 'Scarf');
                } else {
                    advice.push('Light clothing', 'Water bottle');
                }
            }

            return {
                advice: [...new Set(advice)] // Remove duplicates
            };
        } catch (error) {
            console.error('Error getting preparation advice:', error);
            throw new Error('Could not get preparation advice.');
        }
    }
}