"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAskingToChangeCity = void 0;
function isAskingToChangeCity(message) {
    if (!message || typeof message !== 'string') {
        return false;
    }
    const lowerCaseMessage = message.toLowerCase();
    const vietnameseRegex = /\b(doi\s?(thanh\s?pho|noi)?|thay\s?(doi|thanh\s?pho)?|khac|cho\s?khac|noi\s?khac|thanh\s?pho\s?khac)\b/;
    const vietnameseMarkedRegex = /\b(đổi\s?(thành\s?phố|nơi)?|thay\s?(đổi|thành\s?phố)?|khác|chọ\s?khác|nơi\s?khác|thành\s?phố\s?khác)\b/;
    const englishRegex = /\bchange|(change\s?(city|location|place)?|switch\s?(city|location)?|different\s?(city|location|place)?|another\s?(city|location|place)?|new\s?(city|location|place)?)\b/;
    const vietnameseMatch = lowerCaseMessage.match(vietnameseRegex);
    const vietnameseMatchMarked = lowerCaseMessage.match(vietnameseMarkedRegex);
    const englishMatch = lowerCaseMessage.match(englishRegex);
    return vietnameseMatch || vietnameseMatchMarked || englishMatch ? true : false;
}
exports.isAskingToChangeCity = isAskingToChangeCity;
//# sourceMappingURL=isAskingToChangeCity.js.map