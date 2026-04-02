/*
  Warnings:

  - The values [FACEBOOK,INSTAGRAM,YOUTUBE] on the enum `SocialPlatform` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "Availability" ADD VALUE 'NOT_AVAILABLE';

-- AlterEnum
BEGIN;
CREATE TYPE "SocialPlatform_new" AS ENUM ('GITHUB', 'LINKEDIN', 'TWITTER', 'BLUESKY', 'STACKOVERFLOW', 'DEV_TO', 'HASHNODE', 'WEBSITE', 'OTHER');
ALTER TYPE "SocialPlatform" RENAME TO "SocialPlatform_old";
ALTER TYPE "SocialPlatform_new" RENAME TO "SocialPlatform";
DROP TYPE "public"."SocialPlatform_old";
COMMIT;

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fullName" JSONB NOT NULL,
    "title" JSONB NOT NULL,
    "bioShort" JSONB NOT NULL,
    "bioLong" JSONB,
    "yearsOfExperience" INTEGER NOT NULL,
    "availability" "Availability" NOT NULL DEFAULT 'EMPLOYED',
    "openTo" JSONB NOT NULL DEFAULT '[]',
    "email" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(20),
    "preferredContactPlatform" "SocialPlatform" NOT NULL DEFAULT 'LINKEDIN',
    "preferredContactValue" VARCHAR(500) NOT NULL,
    "locationCountry" VARCHAR(100) NOT NULL,
    "locationCity" VARCHAR(100) NOT NULL,
    "locationPostalCode" VARCHAR(20),
    "locationAddress1" VARCHAR(200),
    "locationAddress2" VARCHAR(200),
    "socialLinks" JSONB NOT NULL DEFAULT '[]',
    "resumeUrls" JSONB NOT NULL DEFAULT '{}',
    "certifications" JSONB NOT NULL DEFAULT '[]',
    "metaTitle" VARCHAR(70),
    "metaDescription" VARCHAR(160),
    "ogImageId" UUID,
    "timezone" VARCHAR(50),
    "canonicalUrl" VARCHAR(500),
    "avatarId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID NOT NULL,
    "updatedById" UUID NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "profiles_userId_idx" ON "profiles"("userId");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
