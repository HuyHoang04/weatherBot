export function isAskingForCurrentWeather(message: string): boolean {
    if (!message || typeof message !== 'string') {
        return false;
    }
    
    const lowerCaseMessage = message.toLowerCase();
    const vietnameseTimeRegex = /\b(hien|hien\s?tai|bay\s?gio|luc\s?nay|ngay\s+luc\s+nay)\b/;
    const vietnameseTimeRegexMarked = /\b(hiện|hiện\s?tại|bây\s?giờ|lúc\s?này|ngay\s+lúc\s+này)\b/;
    const englishTimeRegex = /\b(current|now|currently|at\s+the\s+moment)\b/;
        
    const vietnameseMatch = lowerCaseMessage.match(vietnameseTimeRegex);
    const vietnameseMatchMarked = lowerCaseMessage.match(vietnameseTimeRegexMarked);
    const englishMatch = lowerCaseMessage.match(englishTimeRegex);

    return vietnameseMatch || vietnameseMatchMarked || englishMatch ? true : false;
}