-- Add deletedAt columns for soft delete support
ALTER TABLE "Schedule" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Visit" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Photo" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Alert" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Consent" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Foreign keys remain RESTRICT/SET NULL to avoid cascading deletes and preserve soft-deleted rows
