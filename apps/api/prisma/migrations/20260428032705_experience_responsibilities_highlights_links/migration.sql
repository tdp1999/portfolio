/*
  Warnings:

  - You are about to drop the column `achievements` on the `experiences` table. All the data in the column will be lost.
  - You are about to drop the column `clientIndustry` on the `experiences` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "experiences" DROP COLUMN "achievements",
DROP COLUMN "clientIndustry",
ADD COLUMN     "highlights" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "links" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "responsibilities" JSONB NOT NULL DEFAULT '{}';
