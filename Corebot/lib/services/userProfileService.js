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
exports.UserProfileService = void 0;
const client_1 = require("@prisma/client");
class UserProfileService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    createUserProfile(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userProfile = yield this.prisma.userProfile.create({
                    data: {
                        id: data.id,
                        cityName: data.cityName,
                        citylat: data.citylat,
                        citylon: data.citylon,
                        getUpdate: data.getUpdate
                    },
                });
                return userProfile;
            }
            catch (error) {
                console.error('Error creating user profile:', error);
                throw new Error('Failed to create user profile');
            }
        });
    }
    updateUserProfileGetUpdate(id, getUpdate) {
        return this.prisma.userProfile.update({
            where: { id: id },
            data: { getUpdate: getUpdate },
        });
    }
    createOrUpdateUserProfile(data) {
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
    getUsersWithUpdates() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield this.prisma.userProfile.findMany({
                    where: {
                        getUpdate: true,
                        citylat: { not: null },
                        citylon: { not: null }
                    }
                });
                return users;
            }
            catch (error) {
                console.error('Error fetching users with updates:', error);
                throw new Error('Failed to fetch users with updates');
            }
        });
    }
}
exports.UserProfileService = UserProfileService;
//# sourceMappingURL=userProfileService.js.map