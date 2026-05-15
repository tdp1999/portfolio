-- CreateEnum
CREATE TYPE "ProjectLifecycleStatus" AS ENUM ('LIVE', 'SHIPPED', 'ARCHIVED', 'BETA', 'ONGOING');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "lifecycleStatus" "ProjectLifecycleStatus" NOT NULL DEFAULT 'SHIPPED';

-- Backfill: rows with no endDate are still LIVE; rows with endDate keep the SHIPPED default.
UPDATE "projects" SET "lifecycleStatus" = 'LIVE' WHERE "endDate" IS NULL;

-- CreateIndex
CREATE INDEX "projects_lifecycleStatus_status_deletedAt_idx" ON "projects"("lifecycleStatus", "status", "deletedAt");
