/*
  Warnings:

  - You are about to drop the column `userId` on the `user_profiles` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "user_profiles_userId_key";

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "userId";
