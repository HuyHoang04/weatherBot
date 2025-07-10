import { UserProfile } from './userProfile';
export declare class UserProfileService {
    private prisma;
    constructor();
    createUserProfile(data: UserProfile): Promise<{
        id: string;
        cityName: string;
        citylat: number;
        citylon: number;
        getUpdate: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateUserProfileGetUpdate(id: string, getUpdate: boolean): import(".prisma/client").Prisma.Prisma__UserProfileClient<{
        id: string;
        cityName: string;
        citylat: number;
        citylon: number;
        getUpdate: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    createOrUpdateUserProfile(data: UserProfile): import(".prisma/client").Prisma.Prisma__UserProfileClient<{
        id: string;
        cityName: string;
        citylat: number;
        citylon: number;
        getUpdate: boolean;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    getUsersWithUpdates(): Promise<UserProfile[]>;
}
