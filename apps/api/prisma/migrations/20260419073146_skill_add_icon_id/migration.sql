-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "iconId" UUID;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_iconId_fkey" FOREIGN KEY ("iconId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
