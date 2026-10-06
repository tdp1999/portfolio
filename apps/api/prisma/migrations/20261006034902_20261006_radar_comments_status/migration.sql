-- CreateEnum
CREATE TYPE "RadarCommentsStatus" AS ENUM ('NOT_FETCHED', 'FETCHED', 'PARTIAL', 'FAILED');

-- AlterTable
ALTER TABLE "radar_enrichments" ADD COLUMN     "wantsComments" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "radar_items" ADD COLUMN     "commentsError" VARCHAR(500),
ADD COLUMN     "commentsFetchedAt" TIMESTAMP(3),
ADD COLUMN     "commentsFetchedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "commentsStatus" "RadarCommentsStatus" NOT NULL DEFAULT 'NOT_FETCHED';

-- AlterTable
ALTER TABLE "radar_runs" ADD COLUMN     "fetchComments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "warning" VARCHAR(500);
