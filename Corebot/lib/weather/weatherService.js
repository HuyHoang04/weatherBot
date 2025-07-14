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
const suggestionService_1 = require("../suggestion/suggestionService");
class WeatherService {
    constructor() {
        this.apiKey = process.env.OPENWEATHER_API_KEY;
        this.suggestionService = new suggestionService_1.SuggestionService();
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
                // Lấy thông tin từ dự báo hôm nay
                const todayForecast = forecast[0];
                const maxTemp = todayForecast ? todayForecast.maxTemp : temperature;
                // Lấy tất cả suggestions từ database
                const allSuggestions = yield this.suggestionService.getAll();
                // Lặp qua tất cả suggestions
                if (Array.isArray(allSuggestions)) {
                    for (const suggestion of allSuggestions) {
                        // Nếu maxTemp > temperature trong suggestion thì push và break
                        if (maxTemp > suggestion.temperature) {
                            if (suggestion.items && suggestion.items.length > 0) {
                                advice.push(...suggestion.items);
                            }
                            break;
                        }
                    }
                }
                // Nếu không tìm thấy suggestion phù hợp, dùng default
                if (advice.length === 0) {
                    if (maxTemp <= 20) {
                        advice.push('Warm clothing', 'Gloves', 'Scarf');
                    }
                    else {
                        advice.push('Light clothing', 'Water bottle');
                    }
                }
                return {
                    advice: [...new Set(advice)] // Remove duplicates
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