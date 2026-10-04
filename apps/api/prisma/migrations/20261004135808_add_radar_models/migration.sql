-- CreateEnum
CREATE TYPE "RadarPlatform" AS ENUM ('FACEBOOK');

-- CreateEnum
CREATE TYPE "RadarRunFlow" AS ENUM ('MANUAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "RadarStep" AS ENUM ('CAPTURE', 'NORMALIZE', 'ENRICH', 'ANALYZE', 'SYNTHESIZE');

-- CreateEnum
CREATE TYPE "RadarStatus" AS ENUM ('PENDING', 'RUNNING', 'AWAITING_EXTERNAL', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "RadarWorkStatus" AS ENUM ('PENDING', 'CLAIMED', 'DONE');

-- CreateEnum
CREATE TYPE "RadarItemKind" AS ENUM ('POST', 'REEL', 'VIDEO', 'SHARE');

-- CreateTable
CREATE TABLE "radar_sources" (
    "id" UUID NOT NULL,
    "platform" "RadarPlatform" NOT NULL DEFAULT 'FACEBOOK',
    "url" VARCHAR(500) NOT NULL,
    "displayName" VARCHAR(200) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radar_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radar_runs" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "flow" "RadarRunFlow" NOT NULL DEFAULT 'HYBRID',
    "status" "RadarStatus" NOT NULL DEFAULT 'PENDING',
    "windowFrom" TIMESTAMP(3),
    "windowTo" TIMESTAMP(3),
    "itemCap" INTEGER NOT NULL,
    "captureAdapter" VARCHAR(64) NOT NULL,
    "llmAdapter" VARCHAR(64) NOT NULL,
    "itemsCaptured" INTEGER NOT NULL DEFAULT 0,
    "itemsCreated" INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "itemsFailed" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radar_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radar_step_runs" (
    "id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "step" "RadarStep" NOT NULL,
    "status" "RadarStatus" NOT NULL DEFAULT 'PENDING',
    "adapter" VARCHAR(64) NOT NULL,
    "providerJobRef" VARCHAR(200),
    "meta" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radar_step_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radar_items" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "lastRunId" UUID,
    "externalId" VARCHAR(64) NOT NULL,
    "provider" VARCHAR(64) NOT NULL,
    "kind" "RadarItemKind" NOT NULL DEFAULT 'POST',
    "permalink" VARCHAR(1000) NOT NULL,
    "authorName" VARCHAR(200) NOT NULL,
    "authorExternalId" VARCHAR(64),
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "media" JSONB NOT NULL DEFAULT '[]',
    "links" JSONB NOT NULL DEFAULT '[]',
    "comments" JSONB NOT NULL DEFAULT '[]',
    "sharedPost" JSONB,
    "engagement" JSONB NOT NULL DEFAULT '{}',
    "rawPayload" JSONB NOT NULL,
    "workStatus" "RadarWorkStatus" NOT NULL DEFAULT 'PENDING',
    "leaseExpiresAt" TIMESTAMP(3),
    "claimCount" INTEGER NOT NULL DEFAULT 0,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radar_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radar_enrichments" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "tldr" VARCHAR(400) NOT NULL,
    "providerTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contentType" VARCHAR(32) NOT NULL,
    "signalScore" INTEGER NOT NULL,
    "isPromo" BOOLEAN NOT NULL DEFAULT false,
    "isRelevant" BOOLEAN NOT NULL DEFAULT false,
    "imageNotes" TEXT,
    "linkSummaries" JSONB NOT NULL DEFAULT '[]',
    "commentDigest" TEXT,
    "factCheck" TEXT,
    "applyNote" TEXT,
    "producerAdapter" VARCHAR(64) NOT NULL,
    "producerModel" VARCHAR(100) NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radar_enrichments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radar_briefs" (
    "id" UUID NOT NULL,
    "sourceId" UUID,
    "windowFrom" TIMESTAMP(3) NOT NULL,
    "windowTo" TIMESTAMP(3) NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "itemIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workStatus" "RadarWorkStatus" NOT NULL DEFAULT 'PENDING',
    "leaseExpiresAt" TIMESTAMP(3),
    "producerAdapter" VARCHAR(64),
    "producerModel" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radar_briefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radar_workflow_profiles" (
    "id" UUID NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radar_workflow_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "radar_sources_url_key" ON "radar_sources"("url");

-- CreateIndex
CREATE INDEX "radar_runs_sourceId_createdAt_idx" ON "radar_runs"("sourceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "radar_runs_status_idx" ON "radar_runs"("status");

-- CreateIndex
CREATE INDEX "radar_step_runs_status_idx" ON "radar_step_runs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "radar_step_runs_runId_step_key" ON "radar_step_runs"("runId", "step");

-- CreateIndex
CREATE INDEX "radar_items_sourceId_publishedAt_idx" ON "radar_items"("sourceId", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "radar_items_publishedAt_idx" ON "radar_items"("publishedAt" DESC);

-- CreateIndex
CREATE INDEX "radar_items_workStatus_leaseExpiresAt_idx" ON "radar_items"("workStatus", "leaseExpiresAt");

-- CreateIndex
CREATE INDEX "radar_items_lastRunId_idx" ON "radar_items"("lastRunId");

-- CreateIndex
CREATE UNIQUE INDEX "radar_items_sourceId_externalId_key" ON "radar_items"("sourceId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "radar_enrichments_itemId_key" ON "radar_enrichments"("itemId");

-- CreateIndex
CREATE INDEX "radar_enrichments_signalScore_idx" ON "radar_enrichments"("signalScore");

-- CreateIndex
CREATE INDEX "radar_enrichments_contentType_idx" ON "radar_enrichments"("contentType");

-- CreateIndex
CREATE INDEX "radar_enrichments_providerTags_idx" ON "radar_enrichments" USING GIN ("providerTags");

-- CreateIndex
CREATE INDEX "radar_briefs_createdAt_idx" ON "radar_briefs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "radar_briefs_workStatus_leaseExpiresAt_idx" ON "radar_briefs"("workStatus", "leaseExpiresAt");

-- AddForeignKey
ALTER TABLE "radar_runs" ADD CONSTRAINT "radar_runs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "radar_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radar_step_runs" ADD CONSTRAINT "radar_step_runs_runId_fkey" FOREIGN KEY ("runId") REFERENCES "radar_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radar_items" ADD CONSTRAINT "radar_items_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "radar_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radar_items" ADD CONSTRAINT "radar_items_lastRunId_fkey" FOREIGN KEY ("lastRunId") REFERENCES "radar_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radar_enrichments" ADD CONSTRAINT "radar_enrichments_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "radar_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radar_briefs" ADD CONSTRAINT "radar_briefs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "radar_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
