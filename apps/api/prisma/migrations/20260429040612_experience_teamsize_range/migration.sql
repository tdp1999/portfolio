/*
  Warnings:

  - You are about to drop the column `teamSize` on the `experiences` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "experiences" DROP COLUMN "teamSize",
ADD COLUMN     "teamSizeMax" INTEGER,
ADD COLUMN     "teamSizeMin" INTEGER;
