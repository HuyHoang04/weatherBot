import { PrismaClient } from '@prisma/client';
import { UserProfile } from './userProfile';

export class UserProfileService {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async createUserProfile(data: UserProfile) {
        try {
        const userProfile = await this.prisma.userProfile.create({
            data: {
                id: data.id,
                cityName: data.cityName,
                citylat: data.citylat,
                citylon: data.citylon,
                getUpdate: data.getUpdate
            },
        });
        return userProfile;
        } catch (error) {
        console.error('Error creating user profile:', error);
        throw new Error('Failed to create user profile');
        }
    }
    updateUserProfileGetUpdate(id: string, getUpdate: boolean) {
        return this.prisma.userProfile.update({
        where: { id: id },
        data: { getUpdate: getUpdate },
        });
    }
    createOrUpdateUserProfile(data: UserProfile) {
        return this.prisma.userProfile.upsert({
            where: { id: data.id },
            update: {
                cityName: data.cityName,
                citylat: data.citylat,
                citylon: data.citylon,
                getUpdate: data.getUpdate
            },
            create: {
                id: data.id,
                cityName: data.cityName,
                citylat: data.citylat,
                citylon: data.citylon,
                getUpdate: data.getUpdate
            }
        });
  }

  async getUsersWithUpdates() : Promise<UserProfile[]> {
        try {
            const users = await this.prisma.userProfile.findMany({
                where: {
                    getUpdate: true,
                    citylat: { not: null },
                    citylon: { not: null }
                }
            });
            return users;
        } catch (error) {
            console.error('Error fetching users with updates:', error);
            throw new Error('Failed to fetch users with updates');
        }
    }
}