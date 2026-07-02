-- AlterTable
ALTER TABLE "experiences" ADD COLUMN     "descriptionCanonical" JSONB,
ADD COLUMN     "highlightsCanonical" JSONB,
ADD COLUMN     "responsibilitiesCanonical" JSONB;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "bioLongCanonical" JSONB;

-- AlterTable
ALTER TABLE "technical_highlights" ADD COLUMN     "approachCanonical" JSONB,
ADD COLUMN     "challengeCanonical" JSONB,
ADD COLUMN     "outcomeCanonical" JSONB;
