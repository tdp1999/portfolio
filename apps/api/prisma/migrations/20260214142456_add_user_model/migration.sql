-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'VI');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('GITHUB', 'LINKEDIN', 'TWITTER', 'FACEBOOK', 'INSTAGRAM', 'YOUTUBE', 'WEBSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('OPEN_TO_WORK', 'EMPLOYED', 'FREELANCING');

-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('FRONTEND', 'BACKEND', 'DATABASE', 'DEVOPS', 'MOBILE', 'TOOLS', 'LANGUAGES', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectCategory" AS ENUM ('LANDING_PAGE', 'CMS', 'ERP', 'E_COMMERCE', 'DASHBOARD', 'API', 'MOBILE_APP', 'LIBRARY', 'CLI_TOOL', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('PERSONAL', 'TEAM', 'COMPANY', 'OPEN_SOURCE', 'FREELANCE');

-- CreateEnum
CREATE TYPE "ProjectSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('SYNCED', 'PENDING', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "refreshToken" TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
