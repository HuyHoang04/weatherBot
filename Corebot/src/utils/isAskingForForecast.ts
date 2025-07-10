export function isAskingForForecast(message: string): boolean {
    if (!message || typeof message !== 'string') {
        return false;
    }
    
    const lowerCaseMessage = message.toLowerCase();
    
    const vietnameseRegex = /\b(du\s?bao|ngay\s?mai|mai|tuong\s?lai|sap\s?toi|sap\s?den|ngay\s?toi)\b/;
    const vietnameseMarkedRegex = /\b(dự\s?báo|ngày\s?mai|mai|tương\s?lai|sắp\s?tới|sắp\s?đến|ngày\s?tới)\b/;
    const englishRegex = /\b(forecast|tomorrow|prediction|upcoming|future|next\s+days?|weather\s+forecast)\b/;
    
    const vietnameseMatch = lowerCaseMessage.match(vietnameseRegex);
    const vietnameseMatchMarked = lowerCaseMessage.match(vietnameseMarkedRegex);
    const englishMatch = lowerCaseMessage.match(englishRegex);

    return vietnameseMatch || vietnameseMatchMarked || englishMatch ? true : false;
}
