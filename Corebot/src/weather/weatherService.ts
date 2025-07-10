

import { Suggestion } from '../suggestion/suggestion';

export interface GeocodingResponse {
    lat: number;
    lon: number;
    name: string;
    country: string;
}

export class WeatherService {
    private apiKey=  process.env.OPENWEATHER_API_KEY;
    private suggestion: Suggestion;
    
    constructor(suggestion: Suggestion) {
        this.suggestion = suggestion;
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
        // Sử dụng API /forecast thay vì /forecast/daily (đã deprecated)
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
    }

    async getWeatherPreparationAdvice(lat: number, lon: number): Promise<any> {
        try {
            const currentWeather = await this.getWeatherNow(lat, lon);
            const forecast = await this.getWeatherForecast(lat, lon);
            
            const advice = [];
            const temperature = currentWeather.temperature;
            
            // Lấy thông tin từ dự báo hôm nay
            const todayForecast = forecast[0];
            const maxTemp = todayForecast ? todayForecast.maxTemp : temperature;
            
            switch (true) {
                case (maxTemp > 35) :
                {
                    const customSuggestion = this.suggestion.maxTempGreaterThan35;
                    if (customSuggestion && customSuggestion.trim()) {
                        advice.push(`\n ${customSuggestion}\n`);
                    } else {
                        advice.push('\n Sunglasses (very hot sun)\n');
                        advice.push('\n SPF 50+ sunscreen\n');
                        advice.push('\n Lots of water (bring extra bottles)\n');
                        advice.push('\n Light-colored, thin clothing\n');
                        advice.push('\n Sun hat\n');
                    }
                    break;
                }
                case (maxTemp > 30) :
                {
                    const customSuggestion = this.suggestion.maxTempGreaterThan30;
                    if (customSuggestion && customSuggestion.trim()) {
                        advice.push(`\n ${customSuggestion}\n`);
                    } else {
                        advice.push('\n Sunglasses\n');
                        advice.push('\n SPF 50+ sunscreen\n');
                        advice.push('\n Plenty of water\n');
                        advice.push('\n Light, breathable clothing\n');
                    }
                }
                case (maxTemp > 25) :
                {
                    const customSuggestion = this.suggestion.maxTempGreaterThan25;
                    if (customSuggestion && customSuggestion.trim()) {
                        advice.push(`\n ${customSuggestion}\n`);
                    } else {
                        advice.push('\n Sunglasses\n');
                        advice.push('\n SPF 30+ sunscreen\n');
                        advice.push('\n Water bottle\n');
                        advice.push('\n Light clothing\n');
                    }
                }
                case (maxTemp > 20) :
                {
                    const customSuggestion = this.suggestion.maxTempGreaterThan20;
                    if (customSuggestion && customSuggestion.trim()) {
                        advice.push(`\n ${customSuggestion}\n`);
                    } else {
                        advice.push('\n Light jacket\n');
                        advice.push('\n Water bottle');
                    }
                }
                default:
                {
                    advice.push('\n Warm clothing\n');
                    advice.push('\n Gloves\n');
                    advice.push('\n Scarf\n');
                }
            }
            return {
                advice: [...new Set(advice)] 
            };
        } catch (error) {
            console.error('Error getting preparation advice:', error);
            throw new Error('Could not get preparation advice.');
        }
    }
}