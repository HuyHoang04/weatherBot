-- CreateTable
CREATE TABLE "suggestions" (
    "id" TEXT NOT NULL,
    "temperature" TEXT NOT NULL,
    "items" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suggestions_temperature_key" ON "suggestions"("temperature");
