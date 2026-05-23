-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "aboutHeading" JSONB,
ADD COLUMN     "aboutLede" JSONB,
ADD COLUMN     "contentUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "ctaHeading" JSONB,
ADD COLUMN     "ctaLede" JSONB;

-- Backfill: seed `contentUpdatedAt` for existing rows from the row's own
-- `updatedAt`, so the /about hero "Last updated" line doesn't go blank for
-- the pre-existing profile. New rows start NULL until the author clicks
-- "Mark content as updated" in the console.
UPDATE "profiles" SET "contentUpdatedAt" = "updatedAt" WHERE "contentUpdatedAt" IS NULL;
