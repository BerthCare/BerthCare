-- Safety guard: ensure no existing caregivers before adding NOT NULL column.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Caregiver") THEN
    RAISE EXCEPTION 'Migration requires empty Caregiver table or backfilled password hashes before adding passwordHash NOT NULL';
  END IF;
END;
$$;

-- AlterTable
ALTER TABLE "Caregiver" ADD COLUMN "passwordHash" TEXT NOT NULL;
