/*
  Warnings:

  - You are about to drop the column `content` on the `blog_posts` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `experiences` table. All the data in the column will be lost.
  - You are about to drop the column `highlights` on the `experiences` table. All the data in the column will be lost.
  - You are about to drop the column `responsibilities` on the `experiences` table. All the data in the column will be lost.
  - You are about to drop the column `bioLong` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `body` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `approach` on the `technical_highlights` table. All the data in the column will be lost.
  - You are about to drop the column `challenge` on the `technical_highlights` table. All the data in the column will be lost.
  - You are about to drop the column `outcome` on the `technical_highlights` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "blog_posts" DROP COLUMN "content";

-- AlterTable
ALTER TABLE "experiences" DROP COLUMN "description",
DROP COLUMN "highlights",
DROP COLUMN "responsibilities";

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "bioLong";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "body";

-- AlterTable
ALTER TABLE "technical_highlights" DROP COLUMN "approach",
DROP COLUMN "challenge",
DROP COLUMN "outcome";
