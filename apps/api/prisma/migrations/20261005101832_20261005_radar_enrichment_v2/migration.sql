-- AlterTable
ALTER TABLE "radar_enrichments" ADD COLUMN     "context" TEXT,
ADD COLUMN     "scoreReason" TEXT;

-- Data: enrichment schema v2 requires `context` and `scoreReason`. Re-queue every item whose
-- enrichment is older so the worker re-analyzes it; the v1 enrichment stays visible until the
-- v2 one replaces it on submit.
UPDATE "radar_items"
SET "workStatus" = 'PENDING', "claimCount" = 0, "leaseExpiresAt" = NULL
WHERE "id" IN (SELECT "itemId" FROM "radar_enrichments" WHERE "schemaVersion" < 2);
