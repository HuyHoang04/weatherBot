"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCityFromMessage = void 0;
function extractCityFromMessage(message) {
    if (!message || typeof message !== 'string') {
        return '';
    }
    const vietnameseRegex = /(?:^|\s)(?:ở|o|tai|tại|pho|phố)\s+([a-zA-ZÀ-ỹ\s]+)/i;
    const englishRegex = /(?:in|at)\s+([a-zA-Z\s]+)/i;
    const vietnameseMatch = message.match(vietnameseRegex);
    const englishMatch = message.match(englishRegex);
    if (vietnameseMatch) {
        let city = vietnameseMatch[1].trim();
        city = city.replace(/^(thành phố|thanh pho)\s+/i, '');
        return city.normalize("NFD").replace(/[\u0300-\u036f]/g, '');
    }
    if (englishMatch) {
        console.log("English match found", englishMatch);
        let city = englishMatch[1].trim();
        city = city.replace(/^(the city of| city of)\s+/i, '');
        return city;
    }
    return message.trim();
}
exports.extractCityFromMessage = extractCityFromMessage;
//# sourceMappingURL=extractCityFromMessage.js.map