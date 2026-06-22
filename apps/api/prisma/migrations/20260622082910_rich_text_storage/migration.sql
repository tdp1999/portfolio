-- DropForeignKey
ALTER TABLE "blog_posts" DROP CONSTRAINT "blog_posts_featuredImageId_fkey";

-- AlterTable
ALTER TABLE "blog_posts" ADD COLUMN     "contentHtml" JSONB,
ADD COLUMN     "contentJson" JSONB,
ADD COLUMN     "contentSchemaVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "experiences" ADD COLUMN     "descriptionHtml" JSONB,
ADD COLUMN     "descriptionJson" JSONB,
ADD COLUMN     "descriptionSchemaVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "highlightsHtml" JSONB,
ADD COLUMN     "highlightsJson" JSONB,
ADD COLUMN     "highlightsSchemaVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "responsibilitiesHtml" JSONB,
ADD COLUMN     "responsibilitiesJson" JSONB,
ADD COLUMN     "responsibilitiesSchemaVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "bioLongHtml" JSONB,
ADD COLUMN     "bioLongJson" JSONB,
ADD COLUMN     "bioLongSchemaVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "bodyHtml" JSONB,
ADD COLUMN     "bodyJson" JSONB,
ADD COLUMN     "bodySchemaVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "technical_highlights" ADD COLUMN     "approachHtml" JSONB,
ADD COLUMN     "approachJson" JSONB,
ADD COLUMN     "approachSchemaVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "challengeHtml" JSONB,
ADD COLUMN     "challengeJson" JSONB,
ADD COLUMN     "challengeSchemaVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "outcomeHtml" JSONB,
ADD COLUMN     "outcomeJson" JSONB,
ADD COLUMN     "outcomeSchemaVersion" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
