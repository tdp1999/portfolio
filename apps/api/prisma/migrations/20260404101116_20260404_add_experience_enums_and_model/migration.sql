-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'SELF_EMPLOYED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- CreateTable
CREATE TABLE "experiences" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "companyName" VARCHAR(200) NOT NULL,
    "companyUrl" VARCHAR(500),
    "companyLogoId" UUID,
    "position" JSONB NOT NULL,
    "description" JSONB,
    "achievements" JSONB NOT NULL DEFAULT '{}',
    "teamRole" JSONB,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "locationType" "LocationType" NOT NULL DEFAULT 'ONSITE',
    "locationCountry" VARCHAR(100) NOT NULL,
    "locationCity" VARCHAR(100),
    "locationPostalCode" VARCHAR(20),
    "locationAddress1" VARCHAR(300),
    "locationAddress2" VARCHAR(300),
    "clientName" VARCHAR(200),
    "clientIndustry" VARCHAR(100),
    "domain" VARCHAR(100),
    "teamSize" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID NOT NULL,
    "updatedById" UUID NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedById" UUID,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_skills" (
    "experienceId" UUID NOT NULL,
    "skillId" UUID NOT NULL,

    CONSTRAINT "experience_skills_pkey" PRIMARY KEY ("experienceId","skillId")
);

-- CreateIndex
CREATE UNIQUE INDEX "experiences_slug_key" ON "experiences"("slug");

-- CreateIndex
CREATE INDEX "experiences_startDate_idx" ON "experiences"("startDate");

-- CreateIndex
CREATE INDEX "experiences_deletedAt_idx" ON "experiences"("deletedAt");

-- CreateIndex
CREATE INDEX "experiences_displayOrder_idx" ON "experiences"("displayOrder");

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_companyLogoId_fkey" FOREIGN KEY ("companyLogoId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_skills" ADD CONSTRAINT "experience_skills_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "experiences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experience_skills" ADD CONSTRAINT "experience_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
