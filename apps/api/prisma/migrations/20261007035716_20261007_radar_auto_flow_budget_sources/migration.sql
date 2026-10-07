-- AlterEnum
ALTER TYPE "RadarRunFlow" ADD VALUE 'AUTO';

-- AlterTable
ALTER TABLE "ai_usage_records" ADD COLUMN     "groupId" UUID,
ADD COLUMN     "groupType" VARCHAR(32),
ADD COLUMN     "searchQueries" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "radar_enrichments" ADD COLUMN     "sources" JSONB;

-- AlterTable
ALTER TABLE "radar_items" ADD COLUMN     "workError" VARCHAR(1000);

-- AlterTable
ALTER TABLE "radar_runs" ADD COLUMN     "budgetMicroUsd" INTEGER;

-- CreateIndex
CREATE INDEX "ai_usage_records_groupType_groupId_idx" ON "ai_usage_records"("groupType", "groupId");
