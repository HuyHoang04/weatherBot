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
exports.WeatherService = void 0;
class WeatherService {
    constructor(suggestion) {
        this.apiKey = process.env.OPENWEATHER_API_KEY;
        this.suggestion = suggestion;
    }
    getGeocoding(city) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}`;
            try {
                const response = yield fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = yield response.json();
                if (!data || !data.coord) {
                    throw new Error('Invalid response from weather API');
                }
                const geocodingResponse = {
                    lat: data.coord.lat,
                    lon: data.coord.lon,
                    name: data.name,
                    country: data.sys.country
                };
                return geocodingResponse;
            }
            catch (error) {
                console.error('Error fetching geocoding data:', error);
                throw new Error('Could not retrieve geocoding data.');
            }
        });
    }
    getWeatherNow(lat, lon) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
            const response = yield fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = yield response.json();
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
        });
    }
    getWeatherForecast(lat, lon) {
        return __awaiter(this, void 0, void 0, function* () {
            // Sử dụng API /forecast thay vì /forecast/daily (đã deprecated)
            const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
            try {
                const response = yield fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = yield response.json();
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
            }
            catch (error) {
                console.error('Error fetching forecast data:', error);
                throw new Error('Could not retrieve forecast data.');
            }
        });
    }
    getWeatherPreparationAdvice(lat, lon) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const currentWeather = yield this.getWeatherNow(lat, lon);
                const forecast = yield this.getWeatherForecast(lat, lon);
                const advice = [];
                const temperature = currentWeather.temperature;
                // const description = currentWeather.description.toLowerCase();
                // const humidity = currentWeather.humidity;
                // Lấy thông tin từ dự báo hôm nay
                const todayForecast = forecast[0];
                const maxTemp = todayForecast ? todayForecast.maxTemp : temperature;
                // const minTemp = todayForecast ? todayForecast.minTemp : temperature;
                // Temperature-based advice
                if (maxTemp > 35) {
                    const customSuggestion = this.suggestion.getMaxTempGreaterThan35();
                    if (customSuggestion && customSuggestion.trim()) {
                        advice.push(`\n ${customSuggestion}\n`);
                    }
                    else {
                        advice.push('\n Sunglasses (very hot sun)\n');
                        advice.push('\n SPF 50+ sunscreen\n');
                        advice.push('\n Lots of water (bring extra bottles)\n');
                        advice.push('\n Light-colored, thin clothing\n');
                        advice.push('\n Sun hat\n');
                    }
                }
                else if (maxTemp > 30) {
                    const customSuggestion = this.suggestion.getMaxTempGreaterThan30();
                    if (customSuggestion && customSuggestion.trim()) {
                        advice.push(`\n ${customSuggestion}\n`);
                    }
                    else {
                        advice.push('\n Sunglasses\n');
                        advice.push('\n SPF 50+ sunscreen\n');
                        advice.push('\n Plenty of water\n');
                        advice.push('\n Light, breathable clothing\n');
                    }
                }
                else if (maxTemp > 25) {
                    const customSuggestion = this.suggestion.getMaxTempGreaterThan25();
                    if (customSuggestion && customSuggestion.trim()) {
                        advice.push(`\n ${customSuggestion}\n`);
                    }
                    else {
                        advice.push('\n Sunglasses\n');
                        advice.push('\n SPF 30+ sunscreen\n');
                        advice.push('\n Water bottle\n');
                        advice.push('\n Light clothing\n');
                    }
                }
                else if (maxTemp > 20) {
                    const customSuggestion = this.suggestion.getMaxTempGreaterThan20();
                    if (customSuggestion && customSuggestion.trim()) {
                        advice.push(`\n ${customSuggestion}\n`);
                    }
                    else {
                        advice.push('\n Light jacket\n');
                        advice.push('\n Water bottle');
                    }
                }
                else {
                    advice.push('\n Warm clothing\n');
                    advice.push('\n Gloves\n');
                    advice.push('\n Scarf\n');
                }
                // // Weather condition-based advice
                // if (description.includes('rain') || description.includes('drizzle')) {
                //     advice.push('\n Umbrella or raincoat\n');
                //     advice.push('\n Waterproof shoes\n');
                // }
                // if (description.includes('snow')) {
                //     advice.push('\n Non-slip shoes\n');
                //     advice.push('\n Thick gloves\n');
                //     advice.push('\n Warm scarf\n');
                // }
                // if (description.includes('thunderstorm')) {
                //     advice.push('\n Avoid going outside (thunderstorm)\n');
                //     advice.push('\n Sturdy umbrella\n');
                // }
                // // Humidity-based advice
                // if (humidity > 80) {
                //     advice.push('\n Breathable clothing\n');
                //     advice.push('\n Towel for sweat\n');
                // }
                // // Check weather forecast for today and tomorrow
                // let hasRainToday = false;
                // let hasRainTomorrow = false;
                // if (todayForecast && todayForecast.description.toLowerCase().includes('rain')) {
                //     hasRainToday = true;
                //     advice.push('\n Umbrella for today\n');
                // }
                // if (forecast[1] && forecast[1].description.toLowerCase().includes('rain')) {
                //     hasRainTomorrow = true;
                //     advice.push('\n Prepare umbrella for tomorrow\n');
                // }
                return {
                    currentWeather,
                    forecast: todayForecast,
                    advice: [...new Set(advice)]
                };
            }
            catch (error) {
                console.error('Error getting preparation advice:', error);
                throw new Error('Could not get preparation advice.');
            }
        });
    }
}
exports.WeatherService = WeatherService;
//# sourceMappingURL=weatherService.js.map