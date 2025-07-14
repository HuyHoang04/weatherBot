/*
  Warnings:

  - Changed the type of `temperature` on the `suggestions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "suggestions" DROP COLUMN "temperature",
ADD COLUMN     "temperature" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "suggestions_temperature_key" ON "suggestions"("temperature");
