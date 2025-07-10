"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAskingForPreparation = void 0;
function isAskingForPreparation(message) {
    if (!message || typeof message !== 'string') {
        return false;
    }
    const lowerCaseMessage = message.toLowerCase();
    const vietnameseRegex = /\b(chuan\s?bi|mang\s?(theo|gi)?|can\s?(gi|cai\s?gi)?|nen\s?(mang|dung|lam\s?gi)?|do\s?dung|phu\s?kien)\b/;
    const vietnameseMarkedRegex = /\b(chuẩn\s?bị|mang\s?(theo|gì)?|cần\s?(gì|cái\s?gì)?|nên\s?(mang|dùng|làm\s?gì)?|đồ\s?dùng|phụ\s?kiện)\b/;
    const englishRegex = /\b(prepare?|preparation|bring|carry|what\s+(to\s+)?(bring|carry|wear)|equipment|accessories|items?|gear)\b/;
    const vietnameseMatch = lowerCaseMessage.match(vietnameseRegex);
    const vietnameseMatchMarked = lowerCaseMessage.match(vietnameseMarkedRegex);
    const englishMatch = lowerCaseMessage.match(englishRegex);
    return vietnameseMatch || vietnameseMatchMarked || englishMatch ? true : false;
}
exports.isAskingForPreparation = isAskingForPreparation;
//# sourceMappingURL=isAskingForPreparation.js.map