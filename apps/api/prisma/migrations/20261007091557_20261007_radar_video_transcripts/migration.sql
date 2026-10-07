-- CreateEnum
CREATE TYPE "RadarTranscriptStatus" AS ENUM ('NONE', 'PENDING', 'DONE', 'FAILED');

-- AlterTable
ALTER TABLE "radar_items" ADD COLUMN     "transcript" JSONB,
ADD COLUMN     "transcriptAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "transcriptError" VARCHAR(500),
ADD COLUMN     "transcriptStatus" "RadarTranscriptStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "videoDurationSec" INTEGER,
ADD COLUMN     "videoUrl" VARCHAR(2000);
