-- Data: enrichment schema v3 requires `overview` (and `factCheckSeverity` with a fact check).
-- Re-queue every item whose enrichment is older so the worker re-analyzes it; the old
-- enrichment stays visible until the v3 one replaces it.
UPDATE "radar_items" SET "workStatus" = 'PENDING', "claimCount" = 0, "leaseExpiresAt" = NULL
WHERE "id" IN (SELECT "itemId" FROM "radar_enrichments" WHERE "schemaVersion" < 3);
