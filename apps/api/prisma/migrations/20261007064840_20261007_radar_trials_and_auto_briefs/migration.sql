-- CreateEnum
CREATE TYPE "RadarTrialStatus" AS ENUM ('RUNNING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "RadarBriefWriter" AS ENUM ('AUTO', 'WORKER');

-- AlterTable
ALTER TABLE "radar_briefs" ADD COLUMN     "error" VARCHAR(1000),
ADD COLUMN     "writer" "RadarBriefWriter" NOT NULL DEFAULT 'WORKER';

-- CreateTable
CREATE TABLE "radar_enrichment_trials" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "depth" VARCHAR(8) NOT NULL,
    "requestedModel" VARCHAR(100),
    "status" "RadarTrialStatus" NOT NULL DEFAULT 'RUNNING',
    "payload" JSONB,
    "error" VARCHAR(1000),
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costMicroUsd" INTEGER,
    "searchQueries" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "radar_enrichment_trials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "radar_enrichment_trials_itemId_createdAt_idx" ON "radar_enrichment_trials"("itemId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "radar_enrichment_trials" ADD CONSTRAINT "radar_enrichment_trials_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "radar_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
