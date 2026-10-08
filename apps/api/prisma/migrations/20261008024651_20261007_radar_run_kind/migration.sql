-- CreateEnum
CREATE TYPE "RadarRunKind" AS ENUM ('CAPTURE', 'REANALYZE');

-- AlterTable
ALTER TABLE "radar_runs" ADD COLUMN     "kind" "RadarRunKind" NOT NULL DEFAULT 'CAPTURE',
ALTER COLUMN "sourceId" DROP NOT NULL;
