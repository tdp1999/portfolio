-- CreateEnum
CREATE TYPE "RadarTriageStatus" AS ENUM ('INBOX', 'SAVED', 'DONE');

-- AlterTable
ALTER TABLE "radar_items" ADD COLUMN     "triageStatus" "RadarTriageStatus" NOT NULL DEFAULT 'INBOX',
ADD COLUMN     "triagedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "radar_items_triageStatus_publishedAt_idx" ON "radar_items"("triageStatus", "publishedAt" DESC);
