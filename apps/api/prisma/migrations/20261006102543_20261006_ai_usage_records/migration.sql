-- CreateEnum
CREATE TYPE "AiCallStatus" AS ENUM ('SUCCEEDED', 'FAILED', 'RATE_LIMITED');

-- CreateTable
CREATE TABLE "ai_usage_records" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(32) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "feature" VARCHAR(64) NOT NULL,
    "status" "AiCallStatus" NOT NULL,
    "errorKind" VARCHAR(32),
    "error" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "thinkingTokens" INTEGER NOT NULL DEFAULT 0,
    "cachedTokens" INTEGER NOT NULL DEFAULT 0,
    "toolTokens" INTEGER NOT NULL DEFAULT 0,
    "costMicroUsd" INTEGER,
    "billed" BOOLEAN NOT NULL DEFAULT false,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "refType" VARCHAR(32),
    "refId" UUID,
    "trace" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_usage_records_createdAt_idx" ON "ai_usage_records"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ai_usage_records_feature_createdAt_idx" ON "ai_usage_records"("feature", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ai_usage_records_refType_refId_idx" ON "ai_usage_records"("refType", "refId");
