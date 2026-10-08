-- CreateIndex
CREATE INDEX "radar_enrichments_producerModel_idx" ON "radar_enrichments"("producerModel");

-- Backfill: before ADR-036 every AUTO run ran the deep pass. A run still in flight when this
-- deploys keeps that behaviour; finished runs keep false, since the flag no longer matters for them.
UPDATE "radar_runs" SET "deepAnalysis" = true
WHERE "flow" = 'AUTO' AND "status" IN ('PENDING', 'RUNNING', 'AWAITING_EXTERNAL');
