"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAskingToExit = void 0;
function isAskingToExit(message) {
    if (!message || typeof message !== 'string') {
        return false;
    }
    const lowerCaseMessage = message.toLowerCase();
    const vietnameseRegex = /\b(ket\s?thuc|tam\s?biet|thoat|ngung|dung|huy)\b/;
    const vietnameseMarkedRegex = /\b(kết\s?thúc|tạm\s?biệt|thoát|ngừng|dừng|hủy)\b/;
    const englishRegex = /\b(exit|quit|stop|end|bye|goodbye|finish|done|cancel|close)\b/;
    const vietnameseMatch = lowerCaseMessage.match(vietnameseRegex);
    const vietnameseMatchMarked = lowerCaseMessage.match(vietnameseMarkedRegex);
    const englishMatch = lowerCaseMessage.match(englishRegex);
    return vietnameseMatch || vietnameseMatchMarked || englishMatch ? true : false;
}
exports.isAskingToExit = isAskingToExit;
//# sourceMappingURL=isAskingToExit.js.map