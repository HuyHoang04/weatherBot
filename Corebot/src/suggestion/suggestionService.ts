import { PrismaClient } from "@prisma/client";
import { Suggestion } from "./suggestion";

export class SuggestionService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    getAll(): Promise<Suggestion[]> {
        return this.prisma.suggestion.findMany({
            orderBy: {
                temperature: 'desc' 
            }
        });
    }
    

    async saveAll(suggestions: Suggestion[]) {
        console.log('SuggestionService.saveAll called with:', suggestions);
        
        try {
            const results = [];
            
            // Xử lý từng suggestion với upsert
            for (const suggestion of suggestions) {
                console.log(`Processing suggestion for temperature ${suggestion.temperature}:`, suggestion);
                
                const result = await this.prisma.suggestion.upsert({
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
        } catch (error) {
            console.error('Error in SuggestionService.saveAll:', error);
            throw error;
        }
    }

    async deleteByTemperature(temperature: number) {
        console.log(`Deleting suggestion for temperature ${temperature}`);
        
        try {
            const result = await this.prisma.suggestion.delete({
                where: {
                    temperature: temperature
                }
            });
            
            console.log(`Deleted suggestion for temperature ${temperature}:`, result);
            return result;
        } catch (error) {
            console.error(`Error deleting suggestion for temperature ${temperature}:`, error);
            throw error;
        }
    }

}