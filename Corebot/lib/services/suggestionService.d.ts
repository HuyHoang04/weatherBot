import { Suggestion } from "../models/suggestion";
export declare class SuggestionService {
    private prisma;
    constructor();
    getAll(): Promise<Suggestion[]>;
    saveAll(suggestions: Suggestion[]): Promise<{
        count: number;
    }>;
    deleteByTemperature(temperature: number): Promise<{
        id: string;
        temperature: number;
        items: string[];
        createdAt: Date;
        updatedAt: Date;
    }>;
}
