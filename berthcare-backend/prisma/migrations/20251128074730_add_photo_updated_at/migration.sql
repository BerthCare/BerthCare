-- Add updatedAt column to Photo for modification tracking
ALTER TABLE "Photo" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
