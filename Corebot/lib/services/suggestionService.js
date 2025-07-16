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
exports.SuggestionService = void 0;
const client_1 = require("@prisma/client");
class SuggestionService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    getAll() {
        return this.prisma.suggestion.findMany({
            orderBy: {
                temperature: 'desc'
            }
        });
    }
    saveAll(suggestions) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('SuggestionService.saveAll called with:', suggestions);
            try {
                const results = [];
                // Xử lý từng suggestion với upsert
                for (const suggestion of suggestions) {
                    console.log(`Processing suggestion for temperature ${suggestion.temperature}:`, suggestion);
                    const result = yield this.prisma.suggestion.upsert({
                        where: {
                            temperature: suggestion.temperature
                        },
                        update: {
                            items: suggestion.items // Cập nhật items mới
                        },
                        create: {
                            id: suggestion.id,
                            temperature: suggestion.temperature,
                            items: suggestion.items
                        }
                    });
                    console.log(`Upsert result for temperature ${suggestion.temperature}:`, result);
                    results.push(result);
                }
                console.log('All suggestions processed successfully:', results.length);
                return { count: results.length };
            }
            catch (error) {
                console.error('Error in SuggestionService.saveAll:', error);
                throw error;
            }
        });
    }
    deleteByTemperature(temperature) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Deleting suggestion for temperature ${temperature}`);
            try {
                const result = yield this.prisma.suggestion.delete({
                    where: {
                        temperature: temperature
                    }
                });
                console.log(`Deleted suggestion for temperature ${temperature}:`, result);
                return result;
            }
            catch (error) {
                console.error(`Error deleting suggestion for temperature ${temperature}:`, error);
                throw error;
            }
        });
    }
}
exports.SuggestionService = SuggestionService;
//# sourceMappingURL=suggestionService.js.map